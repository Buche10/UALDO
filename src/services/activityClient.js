import { request } from './apiClient';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ID_REGEX = /^\d+$/;

export const ALLOWED_ACTIVITY_MODULES = Object.freeze([
  'inventario',
  'reservas',
  'pedidos',
  'caja',
  'retiros',
  'horas_extra',
  'incidencias',
  'equipo',
]);

const ALLOWED_MODULES_SET = new Set(ALLOWED_ACTIVITY_MODULES);

/**
 * Valida un rango de fechas AAAA-MM-DD de máximo 93 días.
 */
export function isValidActivityDateRange(desde, hasta) {
  if (!desde || !hasta) return true;
  if (!DATE_REGEX.test(desde) || !DATE_REGEX.test(hasta)) return false;
  if (desde > hasta) return false;

  const d1 = new Date(desde);
  const d2 = new Date(hasta);
  const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  return diffDays <= 93;
}

/**
 * GET /api/v1/activity?modulo=&usuario_id=&desde=&hasta=&page=
 */
export async function listActivity(filters = {}) {
  const { modulo, usuarioId, desde, hasta, page } = filters;

  if (desde && !DATE_REGEX.test(desde)) {
    return {
      ok: false,
      status: 400,
      error: 'La fecha inicial debe tener formato AAAA-MM-DD.',
    };
  }

  if (hasta && !DATE_REGEX.test(hasta)) {
    return {
      ok: false,
      status: 400,
      error: 'La fecha final debe tener formato AAAA-MM-DD.',
    };
  }

  if (desde && hasta) {
    if (desde > hasta) {
      return {
        ok: false,
        status: 400,
        error: 'La fecha inicial no puede ser posterior a la fecha final.',
      };
    }
    if (!isValidActivityDateRange(desde, hasta)) {
      return {
        ok: false,
        status: 400,
        error: 'El rango de fechas no puede superar los 93 días.',
      };
    }
  }

  const params = new URLSearchParams();

  if (modulo && typeof modulo === 'string') {
    const cleanModulo = modulo.trim().toLowerCase();
    if (cleanModulo) {
      if (!ALLOWED_MODULES_SET.has(cleanModulo)) {
        return {
          ok: false,
          status: 400,
          error: 'Módulo de actividad no permitido.',
        };
      }
      params.set('modulo', cleanModulo);
    }
  }

  if (usuarioId !== undefined && usuarioId !== null && String(usuarioId).trim() !== '') {
    const idStr = String(usuarioId).trim();
    if (!ID_REGEX.test(idStr) || parseInt(idStr, 10) <= 0) {
      return {
        ok: false,
        status: 400,
        error: 'El identificador de usuario debe ser numérico positivo.',
      };
    }
    params.set('usuario_id', idStr);
  }

  if (desde) params.set('desde', desde);
  if (hasta) params.set('hasta', hasta);

  if (page && Number.isInteger(Number(page)) && Number(page) > 0) {
    params.set('page', String(page));
  }

  const qs = params.toString();
  return request(`/activity${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/v1/activity/people
 */
export async function listActivityPeople() {
  const res = await request('/activity/people');
  if (res.ok && res.data && Array.isArray(res.data.data)) {
    return { ...res, data: res.data.data };
  }
  return res;
}
