import { request } from './apiClient';
import { isValidLocation } from './inventoryLocations';

/**
 * Servicio API para conteos físicos de inventario por ubicación (Brief 19).
 * Exclusivo para rol de dueño (owner).
 */

const VALID_COUNT_STATUSES = ['draft', 'submitted', 'validated', 'escalated', 'applied', 'cancelled'];

export const SALES_PENDING_CODE = 'SALES_PENDING';
export const RUNFOOD_PENDING_CODE = 'RUNFOOD_PENDING';

export const VALID_EXPLANATION_CAUSES = Object.freeze([
  'error_de_conteo',
  'merma_no_registrada',
  'consumo_no_registrado',
  'devolucion',
  'error_de_registro',
  'otro',
]);

/**
 * Lista conteos con filtros opcionales de location, status y page.
 * GET /api/v1/inventory/counts?location=&status=&page=
 */
export const listCounts = async ({ location = '', status = '', page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (location && typeof location === 'string' && location.trim()) {
    const trimmedLoc = location.trim();
    if (isValidLocation(trimmedLoc)) {
      params.set('location', trimmedLoc);
    }
  }
  if (status && typeof status === 'string') {
    const trimmedStatus = status.trim();
    if (VALID_COUNT_STATUSES.includes(trimmedStatus)) {
      params.set('status', trimmedStatus);
    }
  }
  if (page && Number.isInteger(Number(page)) && Number(page) > 1) {
    params.set('page', String(page));
  }

  const qs = params.toString();
  return request(qs ? `/inventory/counts?${qs}` : '/inventory/counts');
};

/**
 * Crea un nuevo conteo físico en estado borrador (draft).
 * POST /api/v1/inventory/counts
 */
export const createCount = async (location, notes = '') => {
  const trimmedLoc = typeof location === 'string' ? location.trim() : '';
  if (!isValidLocation(trimmedLoc)) {
    return {
      ok: false,
      status: 422,
      error: 'Ubicación de conteo no válida.',
      isNetworkError: false,
    };
  }

  const payload = { location: trimmedLoc };
  if (notes && typeof notes === 'string' && notes.trim()) {
    payload.notes = notes.trim();
  }

  return request('/inventory/counts', {
    method: 'POST',
    body: payload,
  });
};

/**
 * Consulta un conteo específico con sus líneas.
 * GET /api/v1/inventory/counts/{id}
 */
export const getCount = async (countId) => {
  const parsedId = parseInt(countId, 10);
  if (isNaN(parsedId) || parsedId <= 0 || !Number.isInteger(Number(countId))) {
    return {
      ok: false,
      status: 400,
      error: 'Identificador de conteo inválido.',
      isNetworkError: false,
    };
  }

  return request(`/inventory/counts/${parsedId}`);
};

/**
 * Normaliza y valida una lista de líneas antes de enviarlas al motor.
 */
function normalizeCountLines(lines) {
  const normalized = [];
  for (const line of lines) {
    const itemId = parseInt(line.item_id, 10);
    if (isNaN(itemId) || itemId <= 0) {
      return { error: 'Identificador de insumo inválido en líneas.' };
    }

    const rawQty = line.counted_quantity;
    if (rawQty === null || rawQty === undefined) continue;

    const strQty = String(rawQty).trim().replace(/,/g, '.');
    if (!/^\d+(\.\d{1,3})?$/.test(strQty)) {
      return {
        error: 'Hay cantidades con formato inválido: revisa los insumos marcados.',
        lineErrors: { [itemId]: ['Usa solo números, con 3 decimales como máximo.'] },
      };
    }
    if (Number(strQty) > 1000000) {
      return {
        error: `La cantidad contada no puede superar 1.000.000 para el insumo ${itemId}.`,
        lineErrors: { [itemId]: ['La cantidad no puede superar 1.000.000.'] },
      };
    }

    const entry = { item_id: itemId, counted_quantity: strQty };
    if (line.note && typeof line.note === 'string' && line.note.trim()) {
      entry.note = line.note.trim();
    }
    normalized.push(entry);
  }
  return { lines: normalized };
}

/**
 * Mapea los errores de validación 422 de una tanda indexados por item_id.
 */
function mapBatchErrors(res, batch) {
  if (res.status !== 422 || !res.data?.errors) return res;
  const lineErrors = {};
  Object.keys(res.data.errors).forEach((key) => {
    const match = key.match(/^lines\.(\d+)\.(.+)$/);
    if (match) {
      const idx = parseInt(match[1], 10);
      const targetItem = batch[idx];
      if (targetItem && targetItem.item_id) {
        lineErrors[targetItem.item_id] = res.data.errors[key];
      }
    }
  });
  return { ...res, lineErrors };
}

/**
 * Guarda o reemplaza líneas de un conteo en tandas de hasta 200.
 * PUT /api/v1/inventory/counts/{id}/lines
 */
export const saveCountLines = async (countId, lines = []) => {
  const parsedId = parseInt(countId, 10);
  if (isNaN(parsedId) || parsedId <= 0 || !Number.isInteger(Number(countId))) {
    return { ok: false, status: 400, error: 'Identificador de conteo inválido.', isNetworkError: false };
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: true, data: { status: 'empty' } };
  }

  const normResult = normalizeCountLines(lines);
  if (normResult.error) {
    return {
      ok: false,
      status: 422,
      error: normResult.error,
      lineErrors: normResult.lineErrors,
      isNetworkError: false,
    };
  }
  if (normResult.lines.length === 0) {
    return { ok: true, data: { status: 'no_lines_to_save' } };
  }

  const BATCH_SIZE = 200;
  let lastRes = null;
  for (let i = 0; i < normResult.lines.length; i += BATCH_SIZE) {
    const batch = normResult.lines.slice(i, i + BATCH_SIZE);
    const res = await request(`/inventory/counts/${parsedId}/lines`, {
      method: 'PUT',
      body: { lines: batch },
    });
    if (!res.ok) {
      return mapBatchErrors(res, batch);
    }
    lastRes = res;
  }
  return lastRes || { ok: true, data: { status: 'saved' } };
};

/**
 * Aplica un conteo físico fijando el stock de la ubicación.
 * POST /api/v1/inventory/counts/{id}/apply
 */
export const applyCount = async (countId) => {
  const parsedId = parseInt(countId, 10);
  if (isNaN(parsedId) || parsedId <= 0 || !Number.isInteger(Number(countId))) {
    return {
      ok: false,
      status: 400,
      error: 'Identificador de conteo inválido.',
      isNetworkError: false,
    };
  }

  return request(`/inventory/counts/${parsedId}/apply`, {
    method: 'POST',
  });
};

/**
 * Cancela un conteo en borrador.
 * POST /api/v1/inventory/counts/{id}/cancel
 */
export const cancelCount = async (countId) => {
  const parsedId = parseInt(countId, 10);
  if (isNaN(parsedId) || parsedId <= 0 || !Number.isInteger(Number(countId))) {
    return {
      ok: false,
      status: 400,
      error: 'Identificador de conteo inválido.',
      isNetworkError: false,
    };
  }

  return request(`/inventory/counts/${parsedId}/cancel`, {
    method: 'POST',
  });
};

/**
 * Crea un cierre diario de inventario para una ubicación y fecha de jornada (Brief 31 / 31p).
 * POST /api/v1/inventory/counts
 */
export const createDailyClose = async (location, businessDate) => {
  const trimmedLoc = typeof location === 'string' ? location.trim() : '';
  if (!isValidLocation(trimmedLoc)) {
    return {
      ok: false,
      status: 422,
      error: 'Ubicación de conteo no válida.',
      isNetworkError: false,
    };
  }

  const trimmedDate = typeof businessDate === 'string' ? businessDate.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
    return {
      ok: false,
      status: 422,
      error: 'Fecha no válida (debe ser AAAA-MM-DD).',
      isNetworkError: false,
    };
  }

  return request('/inventory/counts', {
    method: 'POST',
    body: {
      purpose: 'daily_close',
      location: trimmedLoc,
      business_date: trimmedDate,
    },
  });
};

/**
 * Envía un cierre diario para calcular diferencias contra el sistema.
 * POST /api/v1/inventory/counts/{id}/submit
 */
export const submitCount = async (countId) => {
  const parsedId = parseInt(countId, 10);
  if (isNaN(parsedId) || parsedId <= 0 || !Number.isInteger(Number(countId))) {
    return {
      ok: false,
      status: 400,
      error: 'Identificador de conteo inválido.',
      isNetworkError: false,
    };
  }

  const res = await request(`/inventory/counts/${parsedId}/submit`, {
    method: 'POST',
  });

  if (res.status === 409) {
    const errorMsg = String(res.error || res.data?.message || '');
    if (errorMsg.includes('RunFood todavía no envió') || errorMsg.includes('todavía no envió')) {
      return {
        ...res,
        code: RUNFOOD_PENDING_CODE,
      };
    }
    if (errorMsg.includes('ventas del día') || errorMsg.includes('RunFood')) {
      return {
        ...res,
        code: SALES_PENDING_CODE,
      };
    }
  }

  return res;
};

/**
 * Guarda explicaciones de diferencias en líneas de un cierre diario.
 * PUT /api/v1/inventory/counts/{id}/explanations
 */
export const saveExplanations = async (countId, lines = []) => {
  const parsedId = parseInt(countId, 10);
  if (isNaN(parsedId) || parsedId <= 0 || !Number.isInteger(Number(countId))) {
    return {
      ok: false,
      status: 400,
      error: 'Identificador de conteo inválido.',
      isNetworkError: false,
    };
  }

  if (!Array.isArray(lines)) {
    return {
      ok: false,
      status: 422,
      error: 'Las explicaciones deben ser una lista.',
      isNetworkError: false,
    };
  }

  const normalized = [];
  for (const line of lines) {
    const itemId = parseInt(line.item_id, 10);
    if (isNaN(itemId) || itemId <= 0) {
      return {
        ok: false,
        status: 422,
        error: 'Identificador de insumo inválido.',
        isNetworkError: false,
      };
    }
    if (!VALID_EXPLANATION_CAUSES.includes(line.cause)) {
      return {
        ok: false,
        status: 422,
        error: 'Causa de explicación no válida.',
        isNetworkError: false,
      };
    }
    const explanation = typeof line.explanation === 'string' ? line.explanation.trim() : '';
    if (line.cause === 'otro' && !explanation) {
      return {
        ok: false,
        status: 422,
        error: 'La explicación es obligatoria cuando la causa es Otro.',
        isNetworkError: false,
      };
    }
    if (explanation.length > 500) {
      return {
        ok: false,
        status: 422,
        error: 'La explicación no puede superar los 500 caracteres.',
        isNetworkError: false,
      };
    }
    normalized.push({
      item_id: itemId,
      cause: line.cause,
      explanation: explanation || null,
    });
  }

  return request(`/inventory/counts/${parsedId}/explanations`, {
    method: 'PUT',
    body: { lines: normalized },
  });
};

/**
 * Valida un cierre diario ajustando las diferencias contra inventario.
 * POST /api/v1/inventory/counts/{id}/validate
 */
export const validateCount = async (countId) => {
  const parsedId = parseInt(countId, 10);
  if (isNaN(parsedId) || parsedId <= 0 || !Number.isInteger(Number(countId))) {
    return {
      ok: false,
      status: 400,
      error: 'Identificador de conteo inválido.',
      isNetworkError: false,
    };
  }

  return request(`/inventory/counts/${parsedId}/validate`, {
    method: 'POST',
  });
};

/**
 * Escala un cierre diario a administración con una nota obligatoria.
 * POST /api/v1/inventory/counts/{id}/escalate
 */
export const escalateCount = async (countId, note) => {
  const parsedId = parseInt(countId, 10);
  if (isNaN(parsedId) || parsedId <= 0 || !Number.isInteger(Number(countId))) {
    return {
      ok: false,
      status: 400,
      error: 'Identificador de conteo inválido.',
      isNetworkError: false,
    };
  }

  const trimmedNote = typeof note === 'string' ? note.trim() : '';
  if (!trimmedNote) {
    return {
      ok: false,
      status: 422,
      error: 'Debes ingresar un motivo para escalar.',
      isNetworkError: false,
    };
  }
  if (trimmedNote.length > 500) {
    return {
      ok: false,
      status: 422,
      error: 'El motivo no puede superar los 500 caracteres.',
      isNetworkError: false,
    };
  }

  return request(`/inventory/counts/${parsedId}/escalate`, {
    method: 'POST',
    body: { note: trimmedNote },
  });
};

/**
 * Consulta el resumen de cierres diarios por área para una fecha.
 * GET /api/v1/inventory/daily-close?date=YYYY-MM-DD
 */
export const getDailyCloseSummary = async (date = '') => {
  let url = '/inventory/daily-close';
  if (date) {
    const trimmedDate = typeof date === 'string' ? date.trim() : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
      return {
        ok: false,
        status: 422,
        error: 'Formato de fecha inválido.',
        isNetworkError: false,
      };
    }
    url += `?date=${encodeURIComponent(trimmedDate)}`;
  }
  return request(url);
};

/**
 * Consulta ajustes del cierre diario (recordatorio, escalamiento, áreas).
 * GET /api/v1/inventory/daily-close/settings
 */
export const getDailyCloseSettings = async () => {
  return request('/inventory/daily-close/settings');
};

/**
 * Actualiza ajustes del cierre diario.
 * PUT /api/v1/inventory/daily-close/settings
 */
export const updateDailyCloseSettings = async (data = {}) => {
  const payload = {};
  if (data.reminder_time !== undefined) payload.reminder_time = data.reminder_time;
  if (data.escalation_time !== undefined) payload.escalation_time = data.escalation_time;
  if (data.locations !== undefined) payload.locations = data.locations;

  return request('/inventory/daily-close/settings', {
    method: 'PUT',
    body: payload,
  });
};
