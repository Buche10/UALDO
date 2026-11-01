import { request } from './apiClient';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const QTY_REGEX = /^\d+(\.\d{1,3})?$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Normaliza una cantidad a formato numérico con punto decimal y hasta 3 decimales.
 */
export function normalizeWithdrawalQuantity(val) {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).replace(',', '.').trim();
  if (!QTY_REGEX.test(str)) return null;
  const num = Number(str);
  if (isNaN(num) || num < 0 || num > 1000000) return null;
  return str;
}

/**
 * Mapea errores 422 de stock insuficiente a la línea del insumo correspondiente.
 */
function mapStockErrorToLine(res, items) {
  if (res.status !== 422) return res;
  const message = String(res.error || res.data?.message || '');
  if (!message.includes('no hay suficiente')) return res;

  const lineErrors = {};
  items.forEach((item) => {
    // Si el nombre del insumo o su id aparece en el mensaje, lo asociamos a esa línea
    if (item.name && message.toLowerCase().includes(item.name.toLowerCase())) {
      lineErrors[item.item_id] = [message];
    }
  });

  return { ...res, lineErrors };
}

/**
 * POST /api/v1/withdrawals
 */
export const createWithdrawal = async (data = {}) => {
  const {
    items = [],
    to_location,
    purpose,
    production_template_id,
    client_uuid,
    withdrawn_at,
    late_reason,
  } = data;

  if (!Array.isArray(items) || items.length === 0 || items.length > 15) {
    return {
      ok: false,
      status: 422,
      error: 'Debes incluir entre 1 y 15 insumos.',
      isNetworkError: false,
    };
  }

  const normalizedItems = [];
  const lineErrors = {};

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemId = parseInt(item.item_id, 10);
    if (isNaN(itemId) || itemId <= 0) {
      return {
        ok: false,
        status: 422,
        error: `El insumo en la posición ${i + 1} tiene un identificador inválido.`,
        isNetworkError: false,
      };
    }

    const normQty = normalizeWithdrawalQuantity(item.quantity);
    if (!normQty || Number(normQty) <= 0) {
      lineErrors[itemId] = ['La cantidad debe ser mayor que 0, con máximo 3 decimales.'];
      return {
        ok: false,
        status: 422,
        error: 'Verifica las cantidades ingresadas.',
        lineErrors,
        isNetworkError: false,
      };
    }

    normalizedItems.push({
      item_id: itemId,
      quantity: normQty,
    });
  }

  const cleanPurpose = typeof purpose === 'string' ? purpose.trim() : '';
  if (cleanPurpose.length < 3 || cleanPurpose.length > 200) {
    return {
      ok: false,
      status: 422,
      error: 'El motivo debe tener entre 3 y 200 caracteres.',
      isNetworkError: false,
    };
  }

  if (!client_uuid || !UUID_REGEX.test(String(client_uuid))) {
    return {
      ok: false,
      status: 422,
      error: 'client_uuid inválido.',
      isNetworkError: false,
    };
  }

  let cleanWithdrawnAt = null;
  let cleanLateReason = null;

  if (withdrawn_at) {
    const dateObj = new Date(withdrawn_at);
    if (isNaN(dateObj.getTime())) {
      return {
        ok: false,
        status: 422,
        error: 'Fecha de retiro tardío no válida.',
        isNetworkError: false,
      };
    }

    const now = Date.now();
    const diffMs = now - dateObj.getTime();
    // No puede ser en el futuro (margen de 5 minutos por reloj de servidor)
    if (diffMs < -300000) {
      return {
        ok: false,
        status: 422,
        error: 'La fecha de retiro no puede ser en el futuro.',
        isNetworkError: false,
      };
    }
    // No puede ser mayor a 24 horas atrás
    if (diffMs > 86400000) {
      return {
        ok: false,
        status: 422,
        error: 'La fecha de retiro no puede ser mayor a 24 horas atrás.',
        isNetworkError: false,
      };
    }

    cleanWithdrawnAt = dateObj.toISOString();
    cleanLateReason = typeof late_reason === 'string' ? late_reason.trim() : '';
    if (cleanLateReason.length < 3) {
      return {
        ok: false,
        status: 422,
        error: 'Debes indicar el motivo del retiro tardío.',
        isNetworkError: false,
      };
    }
  }

  const payload = {
    items: normalizedItems,
    purpose: cleanPurpose,
    client_uuid,
  };

  if (to_location) payload.to_location = to_location;
  if (production_template_id) payload.production_template_id = production_template_id;
  if (cleanWithdrawnAt) {
    payload.withdrawn_at = cleanWithdrawnAt;
    payload.late_reason = cleanLateReason;
  }

  const res = await request('/withdrawals', {
    method: 'POST',
    body: payload,
  });

  return mapStockErrorToLine(res, items);
};

/**
 * GET /api/v1/withdrawals
 */
export const listWithdrawals = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.status) queryParams.set('status', filters.status);
  if (filters.from) queryParams.set('from', filters.from);
  if (filters.to) queryParams.set('to', filters.to);
  if (filters.page) queryParams.set('page', filters.page);

  const qs = queryParams.toString();
  const endpoint = qs ? `/withdrawals?${qs}` : '/withdrawals';

  return request(endpoint);
};

/**
 * GET /api/v1/withdrawals/{id}
 */
export const getWithdrawal = async (id) => {
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId) || parsedId <= 0) {
    return {
      ok: false,
      status: 400,
      error: 'Identificador de retiro inválido.',
      isNetworkError: false,
    };
  }

  return request(`/withdrawals/${parsedId}`);
};

/**
 * POST /api/v1/withdrawals/{id}/close
 */
export const closeWithdrawal = async (id, lines = [], note = null) => {
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId) || parsedId <= 0) {
    return {
      ok: false,
      status: 400,
      error: 'Identificador de retiro inválido.',
      isNetworkError: false,
    };
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    return {
      ok: false,
      status: 422,
      error: 'Debes incluir la confirmación de todas las líneas.',
      isNetworkError: false,
    };
  }

  const normalizedLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineId = parseInt(line.line_id, 10);
    if (isNaN(lineId) || lineId <= 0) {
      return {
        ok: false,
        status: 422,
        error: `La línea en posición ${i + 1} tiene un identificador inválido.`,
        isNetworkError: false,
      };
    }

    const consumed = normalizeWithdrawalQuantity(line.consumed);
    const returned = normalizeWithdrawalQuantity(line.returned);

    if (consumed === null || returned === null) {
      return {
        ok: false,
        status: 422,
        error: 'Las cantidades usadas y devueltas deben ser números mayores o iguales a 0, con máximo 3 decimales.',
        isNetworkError: false,
      };
    }

    normalizedLines.push({
      line_id: lineId,
      consumed,
      returned,
    });
  }

  const cleanNote = typeof note === 'string' && note.trim() ? note.trim() : null;

  return request(`/withdrawals/${parsedId}/close`, {
    method: 'POST',
    body: {
      lines: normalizedLines,
      note: cleanNote,
    },
  });
};

/**
 * POST /api/v1/withdrawals/{id}/cancel
 */
export const cancelWithdrawal = async (id, note = null) => {
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId) || parsedId <= 0) {
    return {
      ok: false,
      status: 400,
      error: 'Identificador de retiro inválido.',
      isNetworkError: false,
    };
  }

  const cleanNote = typeof note === 'string' && note.trim() ? note.trim() : null;

  return request(`/withdrawals/${parsedId}/cancel`, {
    method: 'POST',
    body: {
      note: cleanNote,
    },
  });
};

/**
 * GET /api/v1/withdrawals/settings
 */
export const getWithdrawalSettings = async () => {
  return request('/withdrawals/settings');
};

/**
 * PUT /api/v1/withdrawals/settings
 */
export const updateWithdrawalSettings = async (data = {}) => {
  const payload = {};

  if (data.reminder_after_minutes !== undefined) {
    const val = parseInt(data.reminder_after_minutes, 10);
    if (isNaN(val) || val < 15 || val > 1440) {
      return {
        ok: false,
        status: 422,
        error: 'El primer recordatorio debe estar entre 15 y 1440 minutos.',
        isNetworkError: false,
      };
    }
    payload.reminder_after_minutes = val;
  }

  if (data.reminder_interval_minutes !== undefined) {
    const val = parseInt(data.reminder_interval_minutes, 10);
    if (isNaN(val) || val < 15 || val > 1440) {
      return {
        ok: false,
        status: 422,
        error: 'El intervalo entre recordatorios debe estar entre 15 y 1440 minutos.',
        isNetworkError: false,
      };
    }
    payload.reminder_interval_minutes = val;
  }

  if (data.max_reminders !== undefined) {
    const val = parseInt(data.max_reminders, 10);
    if (isNaN(val) || val < 1 || val > 10) {
      return {
        ok: false,
        status: 422,
        error: 'El máximo de recordatorios debe estar entre 1 y 10.',
        isNetworkError: false,
      };
    }
    payload.max_reminders = val;
  }

  if (data.quiet_start !== undefined) {
    if (!TIME_REGEX.test(data.quiet_start)) {
      return {
        ok: false,
        status: 422,
        error: 'El inicio de franja silenciosa debe tener formato HH:MM.',
        isNetworkError: false,
      };
    }
    payload.quiet_start = data.quiet_start;
  }

  if (data.quiet_end !== undefined) {
    if (!TIME_REGEX.test(data.quiet_end)) {
      return {
        ok: false,
        status: 422,
        error: 'El fin de franja silenciosa debe tener formato HH:MM.',
        isNetworkError: false,
      };
    }
    payload.quiet_end = data.quiet_end;
  }

  return request('/withdrawals/settings', {
    method: 'PUT',
    body: payload,
  });
};
