import { request } from './apiClient';
import { normalizeAmount } from './money';

const DECLARATION_ALIASES = new Set(['hoy', 'ayer', 'today', 'yesterday']);

/**
 * Valida si la fecha es válida para la declaración del jefe (hoy, ayer o YYYY-MM-DD).
 *
 * @param {string} fecha
 * @returns {boolean}
 */
export function isValidDeclarationDate(fecha) {
  if (typeof fecha !== 'string') return false;
  const clean = fecha.trim().toLowerCase();
  return DECLARATION_ALIASES.has(clean) || isValidDate(clean);
}

export const DIFFERENCE_CAUSES = Object.freeze([
  'error_de_conteo',
  'vuelto_mal_dado',
  'pago_no_registrado_en_runfood',
  'propina_mezclada',
  'faltante_sin_explicar',
  'otro',
]);

export const DIFFERENCE_CAUSE_LABELS = Object.freeze({
  error_de_conteo: 'Error de conteo',
  vuelto_mal_dado: 'Vuelto mal dado',
  pago_no_registrado_en_runfood: 'Pago no registrado en RunFood',
  propina_mezclada: 'Propina mezclada',
  faltante_sin_explicar: 'Faltante sin explicar',
  otro: 'Otro',
});

/**
 * Valida si una fecha tiene formato YYYY-MM-DD y corresponde a un día de calendario real.
 *
 * @param {string} fecha
 * @returns {boolean}
 */
export function isValidDate(fecha) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }

  const [yearStr, monthStr, dayStr] = fecha.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return (
    dateObj.getUTCFullYear() === year &&
    dateObj.getUTCMonth() === month - 1 &&
    dateObj.getUTCDate() === day
  );
}

const REVIEW_WHITELIST = new Set([
  'efectivo_contado',
  'tarjeta_neto',
  'diners_neto',
  'pedidos_ya_neto',
  'pedidos_ya',
  'decoracion_efectivo',
  'decoracion_tarjeta',
  'decoracion_transferencia',
  'observacion',
  'confirmar',
  'forzar',
  'motivo'
]);

const NETOS_WHITELIST = new Set([
  'tarjeta_neto',
  'diners_neto',
  'pedidos_ya_neto'
]);

/**
 * Consulta la lista de los cierres más recientes (hasta 60).
 */
export async function listCloses() {
  return request('/restaurant/cash-close');
}

/**
 * Consulta el cierre de una fecha específica.
 *
 * @param {string} fecha
 */
export async function getClose(fecha) {
  if (!isValidDate(fecha)) {
    return {
      ok: false,
      status: 400,
      error: 'Fecha inválida. Debe tener formato AAAA-MM-DD y ser una fecha real.'
    };
  }

  const params = new URLSearchParams({ date: fecha });
  return request(`/restaurant/cash-close?${params.toString()}`);
}

/**
 * Revisa o completa los datos del cierre de una fecha.
 *
 * @param {string} fecha
 * @param {Object} data
 */
export async function reviewClose(fecha, data = {}) {
  if (!isValidDate(fecha)) {
    return {
      ok: false,
      status: 400,
      error: 'Fecha inválida. Debe tener formato AAAA-MM-DD y ser una fecha real.'
    };
  }

  if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      if (!REVIEW_WHITELIST.has(key)) {
        return {
          ok: false,
          status: 400,
          error: `Clave no permitida en revisión: ${key}`
        };
      }
    }
  }

  return request(`/restaurant/cash-close/${encodeURIComponent(fecha)}`, {
    method: 'PUT',
    body: data
  });
}

/**
 * Carga los netos reales acreditados por el banco para un día cerrado.
 *
 * @param {string} fecha
 * @param {Object} netos
 */
export async function setNetosReales(fecha, netos = {}) {
  if (!isValidDate(fecha)) {
    return {
      ok: false,
      status: 400,
      error: 'Fecha inválida. Debe tener formato AAAA-MM-DD y ser una fecha real.'
    };
  }

  if (!netos || typeof netos !== 'object') {
    return {
      ok: false,
      status: 400,
      error: 'Debes proporcionar los netos reales.'
    };
  }

  const keys = Object.keys(netos);
  let hasValidNeto = false;

  for (const key of keys) {
    if (!NETOS_WHITELIST.has(key)) {
      return {
        ok: false,
        status: 400,
        error: `Clave no permitida en netos reales: ${key}`
      };
    }
    if (netos[key] !== null && netos[key] !== undefined && netos[key] !== '') {
      hasValidNeto = true;
    }
  }

  if (!hasValidNeto) {
    return {
      ok: false,
      status: 400,
      error: 'Debes incluir al menos un neto real (tarjeta, diners o pedidos ya).'
    };
  }

  return request(`/restaurant/cash-close/${encodeURIComponent(fecha)}/netos-reales`, {
    method: 'POST',
    body: netos
  });
}

/**
 * Reabre un cierre que se encuentra cerrado, pasándolo a revisión.
 *
 * @param {string} fecha
 * @param {string} motivo
 */
export async function reopenClose(fecha, motivo) {
  if (!isValidDate(fecha)) {
    return {
      ok: false,
      status: 400,
      error: 'Fecha inválida. Debe tener formato AAAA-MM-DD y ser una fecha real.'
    };
  }

  if (!motivo || typeof motivo !== 'string' || !motivo.trim() || motivo.trim().length > 300) {
    return {
      ok: false,
      status: 400,
      error: 'El motivo de reapertura es obligatorio (hasta 300 caracteres).'
    };
  }

  return request(`/restaurant/cash-close/${encodeURIComponent(fecha)}/reabrir`, {
    method: 'POST',
    body: { motivo: motivo.trim() }
  });
}

/**
 * Registra un cierre manual para una fecha sin foto de RunFood.
 *
 * @param {Object} data
 */
export async function createManualClose(data = {}) {
  if (!data || !isValidDate(data.fecha)) {
    return {
      ok: false,
      status: 400,
      error: 'Fecha inválida para el cierre manual.'
    };
  }

  return request('/restaurant/cash-close', {
    method: 'POST',
    body: data
  });
}

/**
 * Solicita reevaluar un cierre de caja abierto contra su snapshot vigente de RunFood.
 *
 * @param {string} fecha
 * @returns {Promise<{ok: boolean, status: number, data?: any, error?: string}>}
 */
export async function reevaluateClose(fecha) {
  if (!isValidDate(fecha)) {
    return {
      ok: false,
      status: 400,
      error: 'Fecha inválida. Debe tener formato AAAA-MM-DD y ser una fecha real.'
    };
  }

  return request(`/restaurant/cash-close/${encodeURIComponent(fecha)}/reevaluar`, {
    method: 'POST'
  });
}

/**
 * Consulta la declaración del cierre de caja para el jefe de salón.
 *
 * @param {string} fecha
 * @returns {Promise<{ok: boolean, status: number, data?: any, error?: string}>}
 */
export async function getDeclaration(fecha) {
  if (!isValidDeclarationDate(fecha)) {
    return {
      ok: false,
      status: 400,
      error: 'Fecha inválida. Debe ser hoy, ayer o tener formato AAAA-MM-DD.'
    };
  }

  return request(`/restaurant/cash-close/${encodeURIComponent(fecha)}/declaracion`);
}

/**
 * Envía la declaración del cierre de caja por el jefe de salón.
 *
 * @param {string} fecha
 * @param {Object} data
 * @returns {Promise<{ok: boolean, status: number, isRecount?: boolean, recount?: boolean, message?: string, data?: any, error?: string}>}
 */
export async function submitDeclaration(fecha, data = {}) {
  if (!isValidDeclarationDate(fecha)) {
    return {
      ok: false,
      status: 400,
      error: 'Fecha inválida. Debe ser hoy, ayer o tener formato AAAA-MM-DD.'
    };
  }

  const normalizedCash = normalizeAmount(data?.efectivo_contado);
  if (normalizedCash === null) {
    return {
      ok: false,
      status: 400,
      error: 'El monto de efectivo contado es obligatorio y debe ser válido.'
    };
  }

  const payload = {
    efectivo_contado: normalizedCash
  };

  if (Array.isArray(data?.medios)) {
    const cleanMedios = [];
    for (const m of data.medios) {
      const normalizedMonto = normalizeAmount(m?.monto);
      if (!m || typeof m.medio !== 'string' || normalizedMonto === null) {
        return {
          ok: false,
          status: 400,
          error: 'Cada medio de pago debe incluir un identificador y un monto válido.'
        };
      }
      cleanMedios.push({ medio: m.medio, monto: normalizedMonto });
    }
    payload.medios = cleanMedios;
  }

  if (data?.difference_cause) {
    if (!DIFFERENCE_CAUSES.includes(data.difference_cause)) {
      return {
        ok: false,
        status: 400,
        error: 'Causa de diferencia inválida.'
      };
    }
    payload.difference_cause = data.difference_cause;
  }

  if (data?.difference_explanation !== undefined && data?.difference_explanation !== null) {
    if (
      typeof data.difference_explanation !== 'string' ||
      data.difference_explanation.length > 500 ||
      /<[^>]*>/.test(data.difference_explanation)
    ) {
      return {
        ok: false,
        status: 400,
        error: 'La explicación debe ser texto de hasta 500 caracteres sin etiquetas HTML.'
      };
    }
    if (data.difference_explanation.trim()) {
      payload.difference_explanation = data.difference_explanation.trim();
    }
  }

  const res = await request(`/restaurant/cash-close/${encodeURIComponent(fecha)}/declaracion`, {
    method: 'PUT',
    body: payload
  });

  if (res.status === 409 && (res.data?.code === 'recount' || res.data?.error === 'recount')) {
    return {
      ok: false,
      status: 409,
      isRecount: true,
      recount: true,
      message: res.data?.message || res.error || 'Hay una diferencia en el cierre. Vuelve a contar antes de seguir.',
      error: res.data?.message || res.error || 'Hay una diferencia en el cierre. Vuelve a contar antes de seguir.',
      medio: res.data?.medio,
      diferencia: res.data?.diferencia,
      data: res.data
    };
  }

  return res;
}

/**
 * Consulta la configuración de cierre de caja (jefe de salón, recordatorio y escalamiento).
 *
 * @returns {Promise<{ok: boolean, status: number, data?: any, error?: string}>}
 */
export async function getCashCloseSettings() {
  return request('/restaurant/cash-close/settings');
}

/**
 * Actualiza la configuración de cierre de caja.
 *
 * @param {Object} data
 * @returns {Promise<{ok: boolean, status: number, data?: any, error?: string}>}
 */
export async function updateCashCloseSettings(data = {}) {
  if (!data || typeof data !== 'object') {
    return {
      ok: false,
      status: 400,
      error: 'Datos de configuración inválidos.'
    };
  }

  const payload = {};
  if (data.head_declaration !== undefined) {
    if (typeof data.head_declaration !== 'boolean') {
      return {
        ok: false,
        status: 400,
        error: 'head_declaration debe ser booleano.'
      };
    }
    payload.head_declaration = data.head_declaration;
  }

  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (data.reminder_time !== undefined) {
    if (typeof data.reminder_time !== 'string' || !timeRegex.test(data.reminder_time) || data.reminder_time > '23:45') {
      return {
        ok: false,
        status: 400,
        error: 'La hora del recordatorio debe tener formato HH:MM y ser como máximo 23:45.'
      };
    }
    payload.reminder_time = data.reminder_time;
  }

  if (data.escalation_time !== undefined) {
    if (typeof data.escalation_time !== 'string' || !timeRegex.test(data.escalation_time) || data.escalation_time > '23:45') {
      return {
        ok: false,
        status: 400,
        error: 'La hora límite debe tener formato HH:MM y ser como máximo 23:45.'
      };
    }
    payload.escalation_time = data.escalation_time;
  }

  if (Object.keys(payload).length === 0) {
    return {
      ok: false,
      status: 400,
      error: 'No se enviaron campos de configuración para actualizar.'
    };
  }

  return request('/restaurant/cash-close/settings', {
    method: 'PUT',
    body: payload
  });
}
