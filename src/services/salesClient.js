import { request } from './apiClient';

/**
 * Cliente para analitica de ventas de restaurante (Brief 23p).
 * Contrato: UaldoBusiness/docs/API-sales.md
 * Restringido exclusivamente al dueño del negocio.
 */

export const ALLOWED_SORTS = ['quantity', 'total'];
export const MAX_RANGE_DAYS = 92;

/**
 * Formatea la fecha de hoy local como AAAA-MM-DD.
 *
 * @returns {string}
 */
export function getTodayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Valida si una fecha tiene formato AAAA-MM-DD y corresponde a un dia real de calendario.
 *
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidDate(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
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

/**
 * Cuenta los dias inclusive entre dos fechas AAAA-MM-DD.
 *
 * @param {string} fromStr
 * @param {string} toStr
 * @returns {number}
 */
export function countDaysInRange(fromStr, toStr) {
  const [y1, m1, d1] = fromStr.split('-').map(Number);
  const [y2, m2, d2] = toStr.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((utc2 - utc1) / msPerDay) + 1;
}

/**
 * Valida fechas y rango maximo de 92 dias.
 *
 * @param {string} [from]
 * @param {string} [to]
 * @returns {{ ok: false, status: number, error: string }|null}
 */
export function validateDateRange(from, to) {
  if (from !== undefined && from !== null && from !== '') {
    if (!isValidDate(from)) {
      return {
        ok: false,
        status: 400,
        error: 'Fecha inicial inválida. Debe tener formato AAAA-MM-DD y ser una fecha real.'
      };
    }
  }

  if (to !== undefined && to !== null && to !== '') {
    if (!isValidDate(to)) {
      return {
        ok: false,
        status: 400,
        error: 'Fecha final inválida. Debe tener formato AAAA-MM-DD y ser una fecha real.'
      };
    }
  }

  if (from && to) {
    if (from > to) {
      return {
        ok: false,
        status: 400,
        error: 'La fecha inicial no puede ser posterior a la final.'
      };
    }

    const days = countDaysInRange(from, to);
    if (days > MAX_RANGE_DAYS) {
      return {
        ok: false,
        status: 400,
        error: 'El rango máximo permitido es de 92 días.'
      };
    }
  }

  return null;
}

/**
 * Resumen de ventas del rango: totales globales y serie diaria.
 *
 * @param {{ from?: string, to?: string }} [options]
 * @returns {Promise<{ ok: boolean, data?: object, error?: string, status?: number }>}
 */
export async function getSalesSummary({ from, to } = {}) {
  const validationError = validateDateRange(from, to);
  if (validationError) {
    return validationError;
  }

  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();

  return request(qs ? `/restaurant/sales/summary?${qs}` : '/restaurant/sales/summary');
}

/**
 * Articulos vendidos en el rango, ordenados y paginados.
 * Normaliza data con id y meta para integracion directa con usePagedList.
 *
 * @param {{ from?: string, to?: string, sort?: 'quantity'|'total', page?: number }} [options]
 * @returns {Promise<{ ok: boolean, data?: object, error?: string, status?: number }>}
 */
export async function getSalesItems({ from, to, sort = 'quantity', page = 1 } = {}) {
  const dateError = validateDateRange(from, to);
  if (dateError) {
    return dateError;
  }

  if (sort !== undefined && sort !== null && !ALLOWED_SORTS.includes(sort)) {
    return {
      ok: false,
      status: 400,
      error: 'El parámetro sort debe ser "quantity" o "total".'
    };
  }

  const pageNum = Number(page);
  if (page !== undefined && page !== null && (!Number.isInteger(pageNum) || pageNum < 1)) {
    return {
      ok: false,
      status: 400,
      error: 'La página debe ser un número entero mayor o igual a 1.'
    };
  }

  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (sort) params.set('sort', sort);
  if (page) params.set('page', String(page));

  const res = await request(`/restaurant/sales/items?${params.toString()}`);
  if (!res.ok) {
    return res;
  }

  const rawData = res.data;
  const items = Array.isArray(rawData?.data)
    ? rawData.data.map((item) => ({
        id: item.id ?? item.articulo_id,
        ...item
      }))
    : [];

  const meta = {
    current_page: rawData?.current_page ?? rawData?.meta?.current_page ?? 1,
    last_page: rawData?.last_page ?? rawData?.meta?.last_page ?? 1,
    total: rawData?.total ?? rawData?.meta?.total ?? items.length,
    per_page: rawData?.per_page ?? rawData?.meta?.per_page ?? 20
  };

  return {
    ...res,
    data: {
      ...rawData,
      data: items,
      meta
    }
  };
}

/**
 * Desglose de las 24 horas del dia con promedio diario de pedidos y ventas.
 *
 * @param {{ from?: string, to?: string }} [options]
 * @returns {Promise<{ ok: boolean, data?: object, error?: string, status?: number }>}
 */
export async function getSalesHours({ from, to } = {}) {
  const validationError = validateDateRange(from, to);
  if (validationError) {
    return validationError;
  }

  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();

  return request(qs ? `/restaurant/sales/hours?${qs}` : '/restaurant/sales/hours');
}

/**
 * Ultima foto parcial de ventas enviada por el agente hoy, o null si no hay capturas.
 * Si el endpoint responde 404, se normaliza como ok: true, data: null.
 *
 * @returns {Promise<{ ok: boolean, data?: object|null, error?: string, status?: number }>}
 */
export async function getSalesToday() {
  const res = await request('/restaurant/sales/today');
  if (res.status === 404) {
    return {
      ok: true,
      data: null,
      status: 404
    };
  }
  return res;
}

/**
 * Resumen de ventas de un día cerrado (Brief 27p).
 *
 * @param {{ fecha?: string }} [options]
 * @returns {Promise<{ ok: boolean, data?: object|null, error?: string, status?: number }>}
 */
export async function getSalesDay({ fecha } = {}) {
  if (fecha !== undefined && fecha !== null && fecha !== '') {
    if (!isValidDate(fecha)) {
      return {
        ok: false,
        status: 400,
        error: 'Fecha inválida. Debe tener formato AAAA-MM-DD y ser una fecha real.'
      };
    }
    if (fecha > getTodayIso()) {
      return {
        ok: false,
        status: 400,
        error: 'La fecha no puede ser futura.'
      };
    }
  }

  const qs = fecha ? `?fecha=${fecha}` : '';
  const res = await request(`/restaurant/sales/day${qs}`);
  if (res.status === 404) {
    return {
      ...res,
      error: 'No hay cierre de ventas para ese día'
    };
  }
  return res;
}

/**
 * Ranking de ventas por empleado en el rango (Brief 27p).
 *
 * @param {{ from?: string, to?: string }} [options]
 * @returns {Promise<{ ok: boolean, data?: object|null, error?: string, status?: number }>}
 */
export async function getSalesStaff({ from, to } = {}) {
  const validationError = validateDateRange(from, to);
  if (validationError) {
    return validationError;
  }

  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();

  return request(qs ? `/restaurant/sales/staff?${qs}` : '/restaurant/sales/staff');
}

/**
 * Listado paginado de usuarios del personal en RunFood (Brief 27p).
 *
 * @param {{ page?: number }} [options]
 * @returns {Promise<{ ok: boolean, data?: object, error?: string, status?: number }>}
 */
export async function listRunfoodStaff({ page = 1 } = {}) {
  const pageNum = Number(page);
  if (page !== undefined && page !== null && (!Number.isInteger(pageNum) || pageNum < 1)) {
    return {
      ok: false,
      status: 400,
      error: 'La página debe ser un número entero mayor o igual a 1.'
    };
  }

  const params = new URLSearchParams();
  if (page) params.set('page', String(page));

  return request(`/restaurant/runfood/staff?${params.toString()}`);
}

/**
 * Actualiza o quita el alias de un usuario de RunFood (Brief 27p).
 *
 * @param {string|number} runfoodUserId
 * @param {string|null} alias
 * @returns {Promise<{ ok: boolean, data?: object, error?: string, status?: number }>}
 */
export async function updateRunfoodStaffAlias(runfoodUserId, alias) {
  const idStr = String(runfoodUserId ?? '');
  if (!/^\d+$/.test(idStr)) {
    return {
      ok: false,
      status: 400,
      error: 'El identificador de usuario debe ser numérico.'
    };
  }

  let normalizedAlias = null;
  if (alias !== null && alias !== undefined && alias !== '') {
    if (typeof alias !== 'string') {
      return {
        ok: false,
        status: 400,
        error: 'El alias debe ser un texto válido.'
      };
    }
    const trimmed = alias.trim();
    if (trimmed.length < 1 || alias.length > 60) {
      return {
        ok: false,
        status: 400,
        error: 'El alias debe tener entre 1 y 60 caracteres.'
      };
    }
    if (/[<>]/.test(alias)) {
      return {
        ok: false,
        status: 400,
        error: 'El alias no puede contener etiquetas HTML ni caracteres < o >.'
      };
    }
    normalizedAlias = trimmed;
  }

  return request(`/restaurant/runfood/staff/${idStr}`, {
    method: 'PUT',
    body: { alias: normalizedAlias }
  });
}

