import { request } from './apiClient';

/**
 * Normaliza y valida una cantidad numérica para movimientos de inventario.
 * Formato aceptado: ^\d{1,7}(\.\d{1,3})?$, mayor que 0.
 * Acepta coma como separador decimal y la convierte a punto.
 * Devuelve el string normalizado o null si es inválido.
 */
export const normalizeQuantity = (rawQty) => {
  if (rawQty === null || rawQty === undefined) return null;
  const str = String(rawQty).trim().replace(',', '.');
  if (!/^\d{1,7}(\.\d{1,3})?$/.test(str)) {
    return null;
  }
  const num = parseFloat(str);
  if (num <= 0) {
    return null;
  }
  return str;
};

/**
 * Consulta el inventario paginado con filtros.
 * Filtros según sección 2.1 de API-inventory.md:
 * search, low_stock, type, page
 */
export const listInventory = async ({ search = '', low_stock = false, type = '', page = 1, includeInactive = false } = {}) => {
  const params = new URLSearchParams();
  if (search && typeof search === 'string' && search.trim()) {
    params.set('search', search.trim());
  }
  if (low_stock) {
    params.set('low_stock', '1');
  }
  if (includeInactive) {
    params.set('include_inactive', '1');
  }
  if (type && typeof type === 'string' && type.trim()) {
    params.set('type', type.trim());
  }
  if (page && Number.isInteger(Number(page)) && Number(page) > 1) {
    params.set('page', String(page));
  }

  const queryString = params.toString();
  const path = queryString ? `/inventory?${queryString}` : '/inventory';
  return request(path);
};

/**
 * Consulta alertas de inventario (stock <= reorder_point o min_stock).
 */
export const fetchAlerts = async () => {
  return request('/inventory/alerts');
};

/**
 * Consulta historial de movimientos (ledger) de un insumo específico.
 * itemId debe ser entero positivo.
 */
export const fetchMovements = async (itemId, page = 1) => {
  const parsedId = parseInt(itemId, 10);
  if (isNaN(parsedId) || parsedId <= 0 || !Number.isInteger(Number(itemId))) {
    return {
      ok: false,
      status: 400,
      error: 'Identificador de insumo inválido.',
      isNetworkError: false,
    };
  }

  const params = new URLSearchParams();
  if (page && Number.isInteger(Number(page)) && Number(page) > 1) {
    params.set('page', String(page));
  }
  const qs = params.toString();
  const path = qs ? `/inventory/${parsedId}/movements?${qs}` : `/inventory/${parsedId}/movements`;
  return request(path);
};

/**
 * Registra un movimiento de inventario con idempotencia (client_uuid).
 * itemId: entero positivo
 * movementData: { kind, quantity, reason, location }
 * clientUuid: string UUID
 */
export const registerMovement = async (itemId, movementData, clientUuid) => {
  const parsedId = parseInt(itemId, 10);
  if (isNaN(parsedId) || parsedId <= 0 || !Number.isInteger(Number(itemId))) {
    return {
      ok: false,
      status: 400,
      error: 'Identificador de insumo inválido.',
      isNetworkError: false,
    };
  }

  const normalizedQty = normalizeQuantity(movementData.quantity);
  if (!normalizedQty) {
    return {
      ok: false,
      status: 422,
      error: 'La cantidad debe ser un número positivo con hasta 3 decimales.',
      isNetworkError: false,
    };
  }

  const payload = {
    kind: movementData.kind,
    quantity: normalizedQty,
    reason: movementData.reason || '',
    client_uuid: clientUuid,
  };

  if (movementData.location && movementData.location.trim()) {
    payload.location = movementData.location.trim();
  }

  return request(`/inventory/${parsedId}/movements`, {
    method: 'POST',
    body: payload,
  });
};

/**
 * Crea un nuevo insumo en el catálogo. Exclusivo para dueño (owner).
 * data: { name, unit, min_stock, reorder_point, type, supplier, sku }
 */
export const createItem = async (data) => {
  const payload = {
    name: data.name?.trim() || '',
    unit: data.unit?.trim() || 'unidad',
  };

  if (data.min_stock !== undefined && data.min_stock !== null && data.min_stock !== '') {
    const norm = normalizeQuantity(data.min_stock);
    if (norm) payload.min_stock = norm;
  }

  if (data.reorder_point !== undefined && data.reorder_point !== null && data.reorder_point !== '') {
    const norm = normalizeQuantity(data.reorder_point);
    if (norm) payload.reorder_point = norm;
  }

  if (data.type && data.type.trim()) {
    payload.type = data.type.trim();
  }
  if (data.supplier && data.supplier.trim()) {
    payload.supplier = data.supplier.trim();
  }
  if (data.sku && data.sku.trim()) {
    payload.sku = data.sku.trim();
  }

  return request('/inventory/items', {
    method: 'POST',
    body: payload,
  });
};
