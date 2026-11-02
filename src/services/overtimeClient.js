import { request } from './apiClient';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const ID_REGEX = /^\d+$/;

/**
 * Devuelve la fecha actual en formato local AAAA-MM-DD.
 */
export function getTodayDateString(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Devuelve la fecha de 7 dias atras en formato local AAAA-MM-DD.
 */
export function getMinOvertimeDateString(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  d.setDate(d.getDate() - 7);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Devuelve el mes actual en formato AAAA-MM.
 */
export function getCurrentMonthString(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Valida si las horas estan entre 0 y 12 y en pasos de 0,25.
 */
export function isValidOvertimeHours(hours) {
  if (hours === null || hours === undefined || hours === '') return false;
  const num = Number(String(hours).replace(',', '.').trim());
  if (isNaN(num) || num <= 0 || num > 12) return false;
  return Math.round(num * 100) % 25 === 0;
}

/**
 * Valida si la fecha esta entre hoy y 7 dias atras.
 */
export function isValidOvertimeDate(dateStr, referenceDate = new Date()) {
  if (!dateStr || typeof dateStr !== 'string' || !DATE_REGEX.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) {
    return false;
  }
  const maxDate = getTodayDateString(referenceDate);
  const minDate = getMinOvertimeDateString(referenceDate);
  return dateStr >= minDate && dateStr <= maxDate;
}

/**
 * Valida un mes AAAA-MM no futuro.
 */
export function isValidOvertimeMonth(monthStr, referenceDate = new Date()) {
  if (!monthStr || typeof monthStr !== 'string' || !MONTH_REGEX.test(monthStr)) return false;
  const currentMonth = getCurrentMonthString(referenceDate);
  return monthStr <= currentMonth;
}

/**
 * Valida el trabajador: worker_user_id o worker_name, nunca ambos ni ninguno.
 */
function validateWorker(workerUserId, workerName) {
  const hasUserId = workerUserId !== undefined && workerUserId !== null && String(workerUserId).trim() !== '';
  const hasName = typeof workerName === 'string' && workerName.trim().length > 0;

  if (hasUserId && hasName) {
    return { ok: false, error: 'Indica el usuario o el nombre del trabajador, no ambos.' };
  }
  if (!hasUserId && !hasName) {
    return { ok: false, error: 'Debes indicar el trabajador o su nombre.' };
  }
  if (hasUserId) {
    const idStr = String(workerUserId).trim();
    if (!ID_REGEX.test(idStr) || parseInt(idStr, 10) <= 0) {
      return { ok: false, error: 'El identificador de usuario debe ser numérico positivo.' };
    }
  }
  if (hasName) {
    const trimmed = workerName.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
      return { ok: false, error: 'El nombre del trabajador debe tener entre 2 y 80 caracteres.' };
    }
  }
  return { ok: true };
}

/**
 * POST /api/v1/overtime
 */
export async function createOvertime(data = {}, clientUuid = null) {
  const { area, worker_user_id, worker_name, work_date, hours, note } = data;
  const resolvedUuid = data.client_uuid || clientUuid || null;

  if (!isValidOvertimeHours(hours)) {
    return {
      ok: false,
      status: 400,
      error: 'Las horas deben ser mayores a 0 y hasta 12, en pasos de 0,25.',
    };
  }

  if (!isValidOvertimeDate(work_date)) {
    return {
      ok: false,
      status: 400,
      error: 'La fecha debe ser entre hoy y hasta 7 días atrás.',
    };
  }

  const workerValidation = validateWorker(worker_user_id, worker_name);
  if (!workerValidation.ok) {
    return { ok: false, status: 400, error: workerValidation.error };
  }

  if (note !== undefined && note !== null && typeof note === 'string' && note.trim().length > 300) {
    return {
      ok: false,
      status: 400,
      error: 'La observación no puede superar los 300 caracteres.',
    };
  }

  const body = {
    work_date,
    hours: Number(Number(String(hours).replace(',', '.')).toFixed(2)),
  };

  if (area) body.area = area;
  if (worker_user_id) body.worker_user_id = parseInt(String(worker_user_id), 10);
  if (worker_name) body.worker_name = worker_name.trim();
  if (note && note.trim()) body.note = note.trim();
  if (resolvedUuid) body.client_uuid = resolvedUuid;

  return request('/overtime', {
    method: 'POST',
    body,
  });
}

/**
 * POST /api/v1/overtime/{id}/void
 */
export async function voidOvertime(id, reason) {
  const idStr = String(id ?? '').trim();
  if (!ID_REGEX.test(idStr) || parseInt(idStr, 10) <= 0) {
    return {
      ok: false,
      status: 400,
      error: 'Identificador de registro inválido.',
    };
  }

  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
  if (trimmedReason.length < 5 || trimmedReason.length > 300) {
    return {
      ok: false,
      status: 400,
      error: 'El motivo de anulación es obligatorio y debe tener entre 5 y 300 caracteres.',
    };
  }

  return request(`/overtime/${idStr}/void`, {
    method: 'POST',
    body: { reason: trimmedReason },
  });
}

/**
 * GET /api/v1/overtime?from=&to=&area=&worker=&page=
 */
export async function listOvertime(filters = {}) {
  const params = new URLSearchParams();

  if (filters.page && Number.isInteger(Number(filters.page)) && Number(filters.page) > 0) {
    params.set('page', String(filters.page));
  }
  if (filters.from && DATE_REGEX.test(filters.from)) {
    params.set('from', filters.from);
  }
  if (filters.to && DATE_REGEX.test(filters.to)) {
    params.set('to', filters.to);
  }
  if (filters.area && (filters.area === 'kitchen' || filters.area === 'lounge')) {
    params.set('area', filters.area);
  }
  if (filters.worker && String(filters.worker).trim()) {
    params.set('worker', String(filters.worker).trim());
  }

  const qs = params.toString();
  return request(`/overtime${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/v1/overtime/workers?area=
 */
export async function listOvertimeWorkers(area = null) {
  const params = new URLSearchParams();
  if (area && (area === 'kitchen' || area === 'lounge')) {
    params.set('area', area);
  }
  const qs = params.toString();
  const res = await request(`/overtime/workers${qs ? `?${qs}` : ''}`);
  if (res.ok && res.data && Array.isArray(res.data.data)) {
    return { ...res, data: res.data.data };
  }
  return res;
}

/**
 * GET /api/v1/overtime/summary?month=YYYY-MM
 */
export async function getOvertimeSummary(month) {
  if (!isValidOvertimeMonth(month)) {
    return {
      ok: false,
      status: 400,
      error: 'El mes debe tener formato AAAA-MM y no puede ser futuro.',
    };
  }

  const res = await request(`/overtime/summary?month=${encodeURIComponent(month)}`);
  if (res.ok && res.data && typeof res.data === 'object' && 'data' in res.data) {
    return { ...res, data: res.data.data };
  }
  return res;
}
