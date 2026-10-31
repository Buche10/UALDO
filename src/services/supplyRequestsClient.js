import { request } from './apiClient';

/**
 * Cliente de pedidos internos (Brief 22p / 26p).
 * Contrato: UaldoBusiness/docs/API-supply-requests.md. Cualquier miembro pide
 * y sigue sus pedidos; el dueño decide, marca comprado y recibido y ve la
 * lista de compras. Las cantidades viajan como texto validado.
 */

export const REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'purchased', 'received', 'cancelled'];
const QUANTITY_FORMAT = /^\d{1,6}(\.\d{1,3})?$/;
const MAX_QUANTITY = 100000;
const MAX_ITEMS = 30;

const invalid = (status, error, errors) => ({ ok: false, status, error, isNetworkError: false, ...(errors ? { data: { errors } } : {}) });
const trimmed = (value) => (typeof value === 'string' ? value.trim() : '');

export function parseId(value) {
  if (!/^\d+$/.test(String(value ?? '').trim())) return null;
  const parsed = parseInt(String(value).trim(), 10);
  return parsed > 0 ? parsed : null;
}

/** Cantidad con punto decimal, mayor que 0, hasta 100000 y 3 decimales, o null. */
export function normalizeRequestQuantity(raw) {
  if (raw === null || raw === undefined) return null;
  const value = String(raw).trim().replace(/,/g, '.');
  if (!QUANTITY_FORMAT.test(value)) return null;
  const number = Number(value);
  return number > 0 && number <= MAX_QUANTITY ? value : null;
}

export const listRequests = async ({ status, mine = false, page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (REQUEST_STATUSES.includes(status)) params.set('status', status);
  if (mine) params.set('mine', '1');
  if (Number.isInteger(Number(page)) && Number(page) > 1) params.set('page', String(page));
  const qs = params.toString();
  return request(qs ? `/supply-requests?${qs}` : '/supply-requests');
};

export const getRequest = async (requestId) => {
  const id = parseId(requestId);
  if (!id) return invalid(400, 'Identificador de pedido inválido.');
  return request(`/supply-requests/${id}`);
};

export const getShoppingList = async () => request('/supply-requests/shopping-list');

/** Obtiene la vista consolidada de compras con aprobado, por_aprobar y bajo_minimo (Brief 26p). */
export const getPurchasingOverview = async () => request('/supply-requests/shopping-list?overview=1');

/** Valida una línea del catálogo o en texto libre, con las claves del motor. */
function buildItem(item, index, errors) {
  const key = (field) => `items.${index}.${field}`;
  const rawQty = item?.quantity;
  const entry = {};

  // Cantidad es opcional (Brief 26p): si está vacía se omite, nunca envía 0
  if (rawQty !== null && rawQty !== undefined && String(rawQty).trim() !== '') {
    const quantity = normalizeRequestQuantity(rawQty);
    if (!quantity) {
      errors[key('quantity')] = ['La cantidad debe ser mayor que 0 y hasta 100000, con 3 decimales como máximo.'];
    } else {
      entry.quantity = quantity;
    }
  }

  const itemId = parseId(item?.inventory_item_id);
  if (itemId) {
    entry.inventory_item_id = itemId;
  } else {
    const name = trimmed(item?.free_text_name);
    const unit = trimmed(item?.unit);
    if (!name || name.length > 120) errors[key('free_text_name')] = ['Escribe qué necesitas (hasta 120 caracteres).'];
    if (!unit || unit.length > 20) errors[key('unit')] = ['Indica la unidad (hasta 20 caracteres).'];
    entry.free_text_name = name;
    entry.unit = unit;
  }

  const note = trimmed(item?.note);
  if (note.length > 200) errors[key('note')] = ['La nota de la línea admite hasta 200 caracteres.'];
  if (note) entry.note = note;
  return entry;
}

export function buildRequestBody(data) {
  const errors = {};
  const items = Array.isArray(data?.items) ? data.items : [];
  if (items.length === 0) errors.items = ['Agrega al menos un insumo.'];
  if (items.length > MAX_ITEMS) errors.items = ['Un pedido admite hasta 30 líneas.'];
  const built = items.slice(0, MAX_ITEMS).map((item, index) => buildItem(item, index, errors));

  const note = trimmed(data?.note);
  if (note.length > 500) errors.note = ['La nota admite hasta 500 caracteres.'];
  const body = { priority: data?.priority === 'urgent' ? 'urgent' : 'normal', items: built };
  if (note) body.note = note;
  return { body, errors };
}

export const createRequest = async (data, clientUuid) => {
  const { body, errors } = buildRequestBody(data);
  if (Object.keys(errors).length > 0) return invalid(422, 'Revisa los datos del pedido.', errors);
  if (clientUuid) body.client_uuid = clientUuid;
  return request('/supply-requests', { method: 'POST', body });
};

export const decideRequest = async (requestId, decision, note, items) => {
  const id = parseId(requestId);
  if (!id) return invalid(400, 'Identificador de pedido inválido.');
  if (decision !== 'approved' && decision !== 'rejected') return invalid(422, 'Decisión no válida.');
  const text = trimmed(note);
  if (decision === 'rejected' && !text) return invalid(422, 'Indica el motivo del rechazo.', { note: ['Indica el motivo del rechazo.'] });
  if (text.length > 500) return invalid(422, 'La nota admite hasta 500 caracteres.', { note: ['La nota admite hasta 500 caracteres.'] });
  const body = { decision };
  if (text) body.note = text;
  if (decision === 'approved' && Array.isArray(items) && items.length > 0) {
    const validItems = [];
    for (const it of items) {
      const itId = parseId(it?.id);
      const itQty = normalizeRequestQuantity(it?.quantity);
      if (itId && itQty) {
        validItems.push({ id: itId, quantity: itQty });
      }
    }
    if (validItems.length > 0) {
      body.items = validItems;
    }
  }
  return request(`/supply-requests/${id}/decision`, { method: 'POST', body });
};

const transition = (action) => async (requestId) => {
  const id = parseId(requestId);
  if (!id) return invalid(400, 'Identificador de pedido inválido.');
  return request(`/supply-requests/${id}/${action}`, { method: 'POST' });
};

export const markPurchased = transition('purchased');
export const markReceived = transition('received');
export const cancelRequest = transition('cancel');
