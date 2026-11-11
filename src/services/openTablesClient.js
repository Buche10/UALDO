import { request } from './apiClient';

/**
 * Cliente de mesas abiertas de RunFood (Brief 47p).
 * Contrato: GET /api/v1/restaurant/open-tables (Brief 56 del motor).
 * El motor decide si manda montos; este cliente nunca los inventa.
 */

export const OPEN_TABLES_PATH = '/restaurant/open-tables';
export const OPEN_TABLES_FORBIDDEN_MESSAGE = 'No tienes permiso para ver las mesas abiertas.';

/**
 * Normaliza la respuesta del motor sin agregar campos de dinero.
 * Si `mesas` falta, devuelve una lista vacía.
 *
 * @param {object|null|undefined} raw
 * @returns {object}
 */
export function normalizeOpenTables(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const mesas = Array.isArray(source.mesas)
    ? source.mesas.filter((mesa) => mesa && typeof mesa === 'object')
    : [];

  return {
    ...source,
    capturada_en: source.capturada_en ?? null,
    desactualizado: source.desactualizado === true,
    minutos_desde_foto: source.minutos_desde_foto ?? null,
    mostrar_montos: source.mostrar_montos === true,
    resumen: source.resumen && typeof source.resumen === 'object' ? { ...source.resumen } : {},
    mesas,
  };
}

/**
 * Consulta las mesas abiertas ahora en RunFood.
 *
 * @returns {Promise<{ ok: boolean, data?: object, error?: string, status?: number }>}
 */
export async function getOpenTables() {
  const res = await request(OPEN_TABLES_PATH);

  if (res.status === 403) {
    return { ...res, ok: false, error: OPEN_TABLES_FORBIDDEN_MESSAGE };
  }

  if (!res.ok) {
    return res;
  }

  return { ...res, data: normalizeOpenTables(res.data) };
}
