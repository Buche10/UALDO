import { request } from './apiClient';

/**
 * Valida si una fecha tiene formato YYYY-MM-DD y corresponde a un dia de calendario real.
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
 * Consulta la lista de los cierres mas recientes (hasta 60).
 */
export async function listCloses() {
  return request('/restaurant/cash-close');
}

/**
 * Consulta el cierre de una fecha especifica.
 *
 * @param {string} fecha
 */
export async function getClose(fecha) {
  if (!isValidDate(fecha)) {
    return {
      ok: false,
      status: 400,
      error: 'Fecha invalida. Debe tener formato AAAA-MM-DD y ser una fecha real.'
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
      error: 'Fecha invalida. Debe tener formato AAAA-MM-DD y ser una fecha real.'
    };
  }

  if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      if (!REVIEW_WHITELIST.has(key)) {
        return {
          ok: false,
          status: 400,
          error: `Clave no permitida en revision: ${key}`
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
 * Carga los netos reales acreditados por el banco para un dia cerrado.
 *
 * @param {string} fecha
 * @param {Object} netos
 */
export async function setNetosReales(fecha, netos = {}) {
  if (!isValidDate(fecha)) {
    return {
      ok: false,
      status: 400,
      error: 'Fecha invalida. Debe tener formato AAAA-MM-DD y ser una fecha real.'
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
 * Reabre un cierre que se encuentra cerrado, pasandolo a revision.
 *
 * @param {string} fecha
 * @param {string} motivo
 */
export async function reopenClose(fecha, motivo) {
  if (!isValidDate(fecha)) {
    return {
      ok: false,
      status: 400,
      error: 'Fecha invalida. Debe tener formato AAAA-MM-DD y ser una fecha real.'
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
      error: 'Fecha invalida para el cierre manual.'
    };
  }

  return request('/restaurant/cash-close', {
    method: 'POST',
    body: data
  });
}
