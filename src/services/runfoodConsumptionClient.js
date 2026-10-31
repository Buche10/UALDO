import { request } from './apiClient';
import { isValidLocation, DEFAULT_LOCATION } from './inventoryLocations';

/**
 * Cliente para consumo automático de insumos por ventas de RunFood (Brief 25p).
 * Contrato: UaldoBusiness/docs/API-runfood-consumption.md
 * Restringido exclusivamente al dueño del negocio.
 */

export const CONSUMPTION_STATES = [
  'aplicado',
  'apagado',
  'antes_de_inicio',
  'sin_ventas',
  'fallido'
];

export const MAX_RECALCULATE_DAYS = 31;
export const MAX_START_DATE_OFFSET_DAYS = 30;

/**
 * Descompone y valida una fecha en formato YYYY-MM-DD.
 * Valida calendario real (años bisiestos, días por mes).
 *
 * @param {unknown} str
 * @returns {{ year: number, month: number, day: number, utcMs: number } | null}
 */
export function parseIsoDateParts(str) {
  if (typeof str !== 'string') return null;
  const trimmed = str.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day, utcMs: dt.getTime() };
}

/**
 * Valida si un string corresponde a una fecha válida YYYY-MM-DD.
 *
 * @param {unknown} str
 * @returns {boolean}
 */
export function isValidDateString(str) {
  return parseIsoDateParts(str) !== null;
}

/**
 * Formatea un objeto Date a YYYY-MM-DD en tiempo local.
 *
 * @param {Date} [date]
 * @returns {string}
 */
export function toIsoDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Obtiene la fecha de ayer en formato YYYY-MM-DD.
 *
 * @param {Date} [refDate]
 * @returns {string}
 */
export function getYesterdayIsoString(refDate = new Date()) {
  const d = new Date(refDate);
  d.setDate(d.getDate() - 1);
  return toIsoDateString(d);
}

/**
 * Valida la fecha de inicio para activar el consumo (entre -30 y +30 días de la fecha de referencia).
 *
 * @param {string} startDateStr
 * @param {Date} [referenceDate]
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateStartDate(startDateStr, referenceDate = new Date()) {
  const parts = parseIsoDateParts(startDateStr);
  if (!parts) {
    return { valid: false, error: 'La fecha de inicio debe tener formato AAAA-MM-DD válido.' };
  }

  const refUtc = Date.UTC(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const diffDays = Math.round((parts.utcMs - refUtc) / 86400000);

  if (diffDays < -MAX_START_DATE_OFFSET_DAYS || diffDays > MAX_START_DATE_OFFSET_DAYS) {
    return {
      valid: false,
      error: 'La fecha de inicio debe estar entre 30 días atrás y 30 días adelante.'
    };
  }

  return { valid: true };
}

/**
 * Valida el rango de fechas para el recálculo de consumo.
 *
 * @param {string} desde
 * @param {string} hasta
 * @returns {{ valid: boolean, error?: string, days?: number }}
 */
export function validateRecalculateRange(desde, hasta) {
  const desdeParts = parseIsoDateParts(desde);
  if (!desdeParts) {
    return { valid: false, error: 'La fecha inicial debe tener formato AAAA-MM-DD válido.' };
  }

  const hastaParts = parseIsoDateParts(hasta);
  if (!hastaParts) {
    return { valid: false, error: 'La fecha final debe tener formato AAAA-MM-DD válido.' };
  }

  if (desdeParts.utcMs > hastaParts.utcMs) {
    return { valid: false, error: 'La fecha inicial no puede ser posterior a la fecha final.' };
  }

  const days = Math.round((hastaParts.utcMs - desdeParts.utcMs) / 86400000) + 1;
  if (days > MAX_RECALCULATE_DAYS) {
    return {
      valid: false,
      error: `El rango máximo permitido para recalcular es de ${MAX_RECALCULATE_DAYS} días.`
    };
  }

  return { valid: true, days };
}

/**
 * Obtiene la configuración actual de consumo automático.
 *
 * @returns {Promise<{ ok: boolean, data?: { enabled: boolean, start_date: string|null, location: string }, error?: string, status?: number }>}
 */
export async function getConsumptionSettings() {
  return request('/restaurant/runfood/consumption/settings');
}

/**
 * Actualiza la configuración de consumo automático.
 *
 * @param {{ enabled: boolean, start_date?: string|null, location?: string }} payload
 * @returns {Promise<{ ok: boolean, data?: object, error?: string, status?: number }>}
 */
export async function updateConsumptionSettings({ enabled, start_date, location = DEFAULT_LOCATION }) {
  if (typeof enabled !== 'boolean') {
    return { ok: false, status: 400, error: 'El parámetro enabled debe ser booleano.' };
  }

  const loc = location || DEFAULT_LOCATION;
  if (!isValidLocation(loc)) {
    return { ok: false, status: 400, error: 'Ubicación de inventario no permitida.' };
  }

  if (enabled) {
    if (!start_date) {
      return { ok: false, status: 400, error: 'La fecha de inicio es obligatoria al activar el consumo.' };
    }
    const dateCheck = validateStartDate(start_date);
    if (!dateCheck.valid) {
      return { ok: false, status: 400, error: dateCheck.error };
    }
  }

  return request('/restaurant/runfood/consumption/settings', {
    method: 'PUT',
    body: {
      enabled,
      start_date: enabled ? start_date : null,
      location: loc
    }
  });
}

/**
 * Consulta el consumo de una fecha específica.
 *
 * @param {string} [date]
 * @returns {Promise<{ ok: boolean, data?: object, error?: string, status?: number }>}
 */
export async function getConsumption(date) {
  if (date !== undefined && date !== null && date !== '') {
    if (!isValidDateString(date)) {
      return { ok: false, status: 400, error: 'La fecha debe tener formato AAAA-MM-DD válido.' };
    }
  }

  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return request(`/restaurant/runfood/consumption${query}`);
}

/**
 * Encola el recálculo de consumo para un rango de fechas.
 *
 * @param {{ desde: string, hasta: string }} range
 * @returns {Promise<{ ok: boolean, data?: { status: string, dias_encolados: number }, error?: string, status?: number }>}
 */
export async function recalculateConsumption({ desde, hasta }) {
  const rangeCheck = validateRecalculateRange(desde, hasta);
  if (!rangeCheck.valid) {
    return { ok: false, status: 400, error: rangeCheck.error };
  }

  return request('/restaurant/runfood/consumption/recalcular', {
    method: 'POST',
    body: { desde, hasta }
  });
}
