import { request } from './apiClient';

/**
 * Cliente para catálogo, recetas y mapeo de RunFood (Brief 24p).
 * Contrato: UaldoBusiness/docs/API-runfood-catalog.md
 * Restringido exclusivamente al dueño del negocio.
 */

export const MAPPING_STATUSES = ['pending', 'confirmed', 'ignored'];
export const RECIPE_ESTADOS = ['completa', 'incompleta', 'con_opciones'];
export const MAX_SEARCH_LENGTH = 60;
export const MIN_COVERAGE_DAYS = 1;
export const MAX_COVERAGE_DAYS = 31;
export const MAX_FACTOR = 100000;

/**
 * Valida y formatea un identificador numérico entero positivo.
 *
 * @param {string|number} value
 * @returns {number|null}
 */
export function parseId(value) {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (!/^\d+$/.test(str)) return null;
  const num = parseInt(str, 10);
  return num > 0 ? num : null;
}

/**
 * Valida y normaliza un factor de conversión de unidades.
 * Acepta coma o punto, hasta 6 decimales, estrictamente mayor a 0 y hasta 100000.
 *
 * @param {string|number} raw
 * @returns {string|null}
 */
export function normalizeFactor(raw) {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim().replace(',', '.');
  if (!/^\d{1,6}(\.\d{1,6})?$/.test(str)) {
    return null;
  }
  const num = Number(str);
  if (!Number.isFinite(num) || num <= 0 || num > MAX_FACTOR) {
    return null;
  }
  return str;
}

/**
 * Valida el parámetro de paginación per_page (1 a 100).
 *
 * @param {unknown} perPage
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
export function validatePerPage(perPage) {
  if (perPage === undefined) return { valid: true, value: 20 };
  const num = Number(perPage);
  if (!Number.isInteger(num) || num < 1 || num > 100) {
    return { valid: false, error: 'Los registros por página deben estar entre 1 y 100.' };
  }
  return { valid: true, value: num };
}

/**
 * Valida y obtiene un ID de mapeo obligatorio.
 *
 * @param {unknown} mappingId
 * @returns {{ ok: true, id: number } | { ok: false, status: 400, error: string }}
 */
export function requireValidMappingId(mappingId) {
  const id = parseId(mappingId);
  if (!id) {
    return {
      ok: false,
      status: 400,
      error: 'Identificador de mapeo inválido.'
    };
  }
  return { ok: true, id };
}

/**
 * Valida un texto de búsqueda no mayor a 60 caracteres.
 *
 * @param {string} search
 * @returns {boolean}
 */
export function isValidSearch(search) {
  if (search === null || search === undefined) return true;
  return typeof search === 'string' && search.length <= MAX_SEARCH_LENGTH;
}

/**
 * Consulta la lista paginada de mapeos de ingredientes.
 *
 * @param {{ status?: 'pending'|'confirmed'|'ignored', search?: string, page?: number, per_page?: number }} [options]
 * @returns {Promise<{ ok: boolean, data?: object, error?: string, status?: number }>}
 */
export async function listRunfoodMappings({ status, search, page = 1, per_page = 20 } = {}) {
  if (status !== undefined && status !== null && status !== '' && !MAPPING_STATUSES.includes(status)) {
    return {
      ok: false,
      status: 400,
      error: 'Estado de mapeo inválido. Debe ser pending, confirmed o ignored.'
    };
  }

  if (search !== undefined && search !== null && !isValidSearch(search)) {
    return {
      ok: false,
      status: 400,
      error: 'El texto de búsqueda no puede superar los 60 caracteres.'
    };
  }

  const pageNum = Number(page);
  if (page !== undefined && (!Number.isInteger(pageNum) || pageNum < 1)) {
    return {
      ok: false,
      status: 400,
      error: 'La página debe ser un número entero mayor o igual a 1.'
    };
  }

  const perPageValidation = validatePerPage(per_page);
  if (!perPageValidation.valid) {
    return {
      ok: false,
      status: 400,
      error: perPageValidation.error
    };
  }
  const perPageNum = perPageValidation.value;

  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (search && search.trim()) params.set('search', search.trim());
  if (pageNum > 1) params.set('page', String(pageNum));
  if (perPageNum !== 20) params.set('per_page', String(perPageNum));

  const qs = params.toString();
  return request(qs ? `/restaurant/runfood/mappings?${qs}` : '/restaurant/runfood/mappings');
}

/**
 * Confirma o actualiza la asociación de un artículo de RunFood a un insumo de Ualdo con un factor.
 *
 * @param {number|string} mappingId
 * @param {{ inventory_item_id: number|string, factor: number|string }} payload
 * @returns {Promise<{ ok: boolean, data?: object, error?: string, status?: number }>}
 */
export async function updateRunfoodMapping(mappingId, { inventory_item_id, factor } = {}) {
  const check = requireValidMappingId(mappingId);
  if (!check.ok) return check;
  const id = check.id;

  const itemId = parseId(inventory_item_id);
  if (!itemId) {
    return {
      ok: false,
      status: 400,
      error: 'Debes seleccionar un insumo válido.'
    };
  }

  const normFactor = normalizeFactor(factor);
  if (!normFactor) {
    return {
      ok: false,
      status: 400,
      error: 'El factor debe ser mayor a 0 y hasta 100000, con máximo 6 decimales.'
    };
  }

  return request(`/restaurant/runfood/mappings/${id}`, {
    method: 'PUT',
    body: {
      inventory_item_id: itemId,
      factor: normFactor
    }
  });
}

/**
 * Acepta la sugerencia automática del motor para el mapeo indicado.
 *
 * @param {number|string} mappingId
 * @returns {Promise<{ ok: boolean, data?: object, error?: string, status?: number }>}
 */
export async function acceptRunfoodMappingSuggestion(mappingId) {
  const check = requireValidMappingId(mappingId);
  if (!check.ok) return check;

  return request(`/restaurant/runfood/mappings/${check.id}/aceptar-sugerencia`, {
    method: 'POST'
  });
}

/**
 * Marca un mapeo como ignorado (no descuenta inventario).
 *
 * @param {number|string} mappingId
 * @returns {Promise<{ ok: boolean, data?: object, error?: string, status?: number }>}
 */
export async function ignoreRunfoodMapping(mappingId) {
  const check = requireValidMappingId(mappingId);
  if (!check.ok) return check;

  return request(`/restaurant/runfood/mappings/${check.id}/ignorar`, {
    method: 'POST'
  });
}

/**
 * Reabre un mapeo confirmado o ignorado devolviéndolo a estado pendiente.
 *
 * @param {number|string} mappingId
 * @returns {Promise<{ ok: boolean, data?: object, error?: string, status?: number }>}
 */
export async function reopenRunfoodMapping(mappingId) {
  const check = requireValidMappingId(mappingId);
  if (!check.ok) return check;

  return request(`/restaurant/runfood/mappings/${check.id}/reabrir`, {
    method: 'POST'
  });
}

/**
 * Consulta la lista paginada de recetas de RunFood con sus líneas e insumos asociados.
 *
 * @param {{ estado?: 'completa'|'incompleta'|'con_opciones', search?: string, page?: number, per_page?: number }} [options]
 * @returns {Promise<{ ok: boolean, data?: object, error?: string, status?: number }>}
 */
export async function listRunfoodRecipes({ estado, search, page = 1, per_page = 20 } = {}) {
  if (estado !== undefined && estado !== null && estado !== '' && !RECIPE_ESTADOS.includes(estado)) {
    return {
      ok: false,
      status: 400,
      error: 'Estado de receta inválido. Debe ser completa, incompleta o con_opciones.'
    };
  }

  if (search !== undefined && search !== null && !isValidSearch(search)) {
    return {
      ok: false,
      status: 400,
      error: 'El texto de búsqueda no puede superar los 60 caracteres.'
    };
  }

  const pageNum = Number(page);
  if (page !== undefined && (!Number.isInteger(pageNum) || pageNum < 1)) {
    return {
      ok: false,
      status: 400,
      error: 'La página debe ser un número entero mayor o igual a 1.'
    };
  }

  const perPageValidation = validatePerPage(per_page);
  if (!perPageValidation.valid) {
    return {
      ok: false,
      status: 400,
      error: perPageValidation.error
    };
  }
  const perPageNum = perPageValidation.value;

  const params = new URLSearchParams();
  if (estado) params.set('estado', estado);
  if (search && search.trim()) params.set('search', search.trim());
  if (pageNum > 1) params.set('page', String(pageNum));
  if (perPageNum !== 20) params.set('per_page', String(perPageNum));

  const qs = params.toString();
  return request(qs ? `/restaurant/runfood/recipes?${qs}` : '/restaurant/runfood/recipes');
}

/**
 * Consulta la cobertura de ventas por recetas en los últimos N días.
 *
 * @param {{ days?: number }} [options]
 * @returns {Promise<{ ok: boolean, data?: object, error?: string, status?: number }>}
 */
export async function getRunfoodCoverage({ days = 7 } = {}) {
  const daysNum = Number(days);
  if (!Number.isInteger(daysNum) || daysNum < MIN_COVERAGE_DAYS || daysNum > MAX_COVERAGE_DAYS) {
    return {
      ok: false,
      status: 400,
      error: 'El parámetro days debe ser un número entero entre 1 y 31.'
    };
  }

  const params = new URLSearchParams({ days: String(daysNum) });
  return request(`/restaurant/runfood/coverage?${params.toString()}`);
}
