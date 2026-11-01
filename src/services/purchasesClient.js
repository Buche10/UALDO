import { request } from './apiClient';
import { isValidLocation } from './inventoryLocations';
import { normalizeAmount } from './money';

/**
 * Cliente de proveedores, compras y valor del inventario (Brief 20p / Brief 33p).
 * Contrato: UaldoBusiness/docs/API-purchases.md. Montos y cantidades viajan como texto validado.
 */

const QUANTITY_FORMAT = /^\d{1,7}(\.\d{1,3})?$/;
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const TAX_ID_FORMAT = /^(\d{10}|\d{13})$/;
const PHONE_FORMAT = /^[0-9+()\s-]{6,30}$/;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PURCHASE_STATUSES = ['draft', 'received', 'received_with_issues', 'cancelled'];
const MAX_LINES = 200;

const invalid = (status, error, errors) => ({ ok: false, status, error, isNetworkError: false, ...(errors ? { data: { errors } } : {}) });

export function parseId(value) {
  if (!/^\d+$/.test(String(value ?? '').trim())) return null;
  const parsed = parseInt(String(value).trim(), 10);
  return parsed > 0 ? parsed : null;
}

/** Cantidad con punto decimal, mayor que 0 y hasta 3 decimales, o null. */
export function normalizePurchaseQuantity(raw) {
  if (raw === null || raw === undefined) return null;
  const value = String(raw).trim().replace(/,/g, '.');
  return QUANTITY_FORMAT.test(value) && Number(value) > 0 ? value : null;
}

/** Cantidad con punto decimal, mayor o igual que 0 y hasta 3 decimales, o null. */
export function normalizeReceiptQuantity(raw) {
  if (raw === null || raw === undefined) return null;
  const value = String(raw).trim().replace(/,/g, '.');
  return QUANTITY_FORMAT.test(value) && Number(value) >= 0 ? value : null;
}

/** AAAA-MM-DD y una fecha que existe (rechaza 2026-13-45 o 2026-02-30). */
function isRealDate(value) {
  if (!DATE_FORMAT.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

const trimmed = (value) => (typeof value === 'string' ? value.trim() : '');

function pageParams(params, page) {
  if (Number.isInteger(Number(page)) && Number(page) > 1) params.set('page', String(page));
}

// Proveedores

export const listSuppliers = async ({ search = '', includeInactive = false, page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (trimmed(search)) params.set('search', trimmed(search));
  if (includeInactive) params.set('include_inactive', '1');
  pageParams(params, page);
  const qs = params.toString();
  return request(qs ? `/suppliers?${qs}` : '/suppliers');
};

export function buildSupplierBody(data, { partial = false } = {}) {
  const errors = {};
  const body = {};
  const name = trimmed(data?.name);
  if (name) body.name = name;
  else if (!partial || data?.name !== undefined) errors.name = ['El nombre del proveedor es obligatorio.'];
  if (name.length > 120) errors.name = ['El nombre admite hasta 120 caracteres.'];

  const optional = [
    ['tax_id', TAX_ID_FORMAT, 'El RUC debe tener 13 dígitos o la cédula 10.'],
    ['phone', PHONE_FORMAT, 'El teléfono solo admite números, espacios, guiones, paréntesis y +.'],
    ['email', EMAIL_FORMAT, 'El correo no es válido.'],
  ];
  optional.forEach(([field, format, message]) => {
    const value = trimmed(data?.[field]);
    if (value && !format.test(value)) errors[field] = [message];
    if (data?.[field] !== undefined) body[field] = value || null;
  });
  ['contact_name', 'notes'].forEach((field) => {
    if (data?.[field] !== undefined) body[field] = trimmed(data[field]) || null;
  });
  if (typeof data?.is_active === 'boolean') body.is_active = data.is_active;
  return { body, errors };
}

export const createSupplier = async (data) => {
  const { body, errors } = buildSupplierBody(data);
  if (Object.keys(errors).length > 0) return invalid(422, 'Revisa los datos del proveedor.', errors);
  return request('/suppliers', { method: 'POST', body });
};

export const updateSupplier = async (supplierId, data) => {
  const id = parseId(supplierId);
  if (!id) return invalid(400, 'Identificador de proveedor inválido.');
  const { body, errors } = buildSupplierBody(data, { partial: true });
  if (Object.keys(errors).length > 0) return invalid(422, 'Revisa los datos del proveedor.', errors);
  return request(`/suppliers/${id}`, { method: 'PUT', body });
};

// Compras

export const listPurchases = async ({ status, supplierId, from, to, page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (PURCHASE_STATUSES.includes(status)) params.set('status', status);
  const id = parseId(supplierId);
  if (id) params.set('supplier_id', String(id));
  if (DATE_FORMAT.test(trimmed(from))) params.set('from', trimmed(from));
  if (DATE_FORMAT.test(trimmed(to))) params.set('to', trimmed(to));
  pageParams(params, page);
  const qs = params.toString();
  return request(qs ? `/purchases?${qs}` : '/purchases');
};

export const getPurchase = async (purchaseId) => {
  const id = parseId(purchaseId);
  if (!id) return invalid(400, 'Identificador de compra inválido.');
  return request(`/purchases/${id}`);
};

export function buildPurchaseLines(lines) {
  const errors = {};
  if (!Array.isArray(lines) || lines.length === 0) return { lines: [], errors: { lines: ['Agrega al menos una línea.'] } };
  if (lines.length > MAX_LINES) return { lines: [], errors: { lines: ['Una compra admite hasta 200 líneas.'] } };

  const seen = new Set();
  const normalized = lines.map((line, index) => {
    if (line?.is_other) {
      const freeTextName = trimmed(line?.free_text_name || line?.name);
      const unit = trimmed(line?.unit) || 'unidad';
      const quantity = normalizePurchaseQuantity(line?.quantity);
      const lineTotal = normalizeAmount(line?.line_total);
      const note = trimmed(line?.note);
      if (!freeTextName) errors[`lines.${index}.free_text_name`] = ['El nombre es obligatorio en otras compras.'];
      if (!unit) errors[`lines.${index}.unit`] = ['Indica la unidad.'];
      if (!quantity) errors[`lines.${index}.quantity`] = ['La cantidad debe ser mayor que 0, con 3 decimales como máximo.'];
      if (lineTotal === null) errors[`lines.${index}.line_total`] = ['El total debe tener 2 decimales como máximo.'];
      if (!note) errors[`lines.${index}.note`] = ['El motivo es obligatorio en otras compras.'];
      return { is_other: true, free_text_name: freeTextName, name: freeTextName, unit, quantity, line_total: lineTotal, note };
    }

    const itemId = parseId(line?.item_id);
    const quantity = normalizePurchaseQuantity(line?.quantity);
    const lineTotal = normalizeAmount(line?.line_total);
    if (!itemId || seen.has(itemId)) errors[`lines.${index}.item_id`] = ['Elige un insumo distinto en cada línea.'];
    if (!quantity) errors[`lines.${index}.quantity`] = ['La cantidad debe ser mayor que 0, con 3 decimales como máximo.'];
    if (lineTotal === null) errors[`lines.${index}.line_total`] = ['El total debe tener 2 decimales como máximo.'];
    seen.add(itemId);
    const entry = { item_id: itemId, quantity, line_total: lineTotal };
    const note = trimmed(line?.note);
    return note ? { ...entry, note } : entry;
  });
  return { lines: normalized, errors };
}

export const createPurchase = async (data, clientUuid) => {
  const errors = {};
  const supplierId = parseId(data?.supplierId);
  if (!supplierId) errors.supplier_id = ['Elige el proveedor.'];
  const location = trimmed(data?.location);
  if (location && !isValidLocation(location)) errors.location = ['Ubicación no válida.'];
  const purchasedOn = trimmed(data?.purchasedOn);
  if (purchasedOn && !isRealDate(purchasedOn)) errors.purchased_on = ['La fecha no es válida.'];
  const built = buildPurchaseLines(data?.lines);
  Object.assign(errors, built.errors);
  if (Object.keys(errors).length > 0) return invalid(422, 'Revisa los datos de la compra.', errors);

  const body = { supplier_id: supplierId, lines: built.lines };
  if (location) body.location = location;
  if (purchasedOn) body.purchased_on = purchasedOn;
  if (trimmed(data?.invoiceNumber)) body.invoice_number = trimmed(data.invoiceNumber);
  if (trimmed(data?.notes)) body.notes = trimmed(data.notes);
  if (clientUuid) body.client_uuid = clientUuid;
  return request('/purchases', { method: 'POST', body });
};

export const replacePurchaseLines = async (purchaseId, lines) => {
  const id = parseId(purchaseId);
  if (!id) return invalid(400, 'Identificador de compra inválido.');
  const built = buildPurchaseLines(lines);
  if (Object.keys(built.errors).length > 0) return invalid(422, 'Revisa las líneas de la compra.', built.errors);
  return request(`/purchases/${id}/lines`, { method: 'PUT', body: { lines: built.lines } });
};

export const receivePurchase = async (purchaseId, lines) => {
  const id = parseId(purchaseId);
  if (!id) return invalid(400, 'Identificador de compra inválido.');
  const options = { method: 'POST' };
  if (Array.isArray(lines)) {
    const errors = {};
    const normalizedLines = lines.map((l, index) => {
      const lineId = parseId(l?.line_id ?? l?.id);
      const qty = normalizeReceiptQuantity(l?.received_quantity ?? l?.quantity);
      if (!lineId) errors[`lines.${index}.line_id`] = ['Identificador de línea inválido.'];
      if (qty === null) errors[`lines.${index}.received_quantity`] = ['La cantidad recibida debe ser mayor o igual a 0.'];
      return { line_id: lineId, received_quantity: qty };
    });
    if (Object.keys(errors).length > 0) return invalid(422, 'Revisa las cantidades recibidas.', errors);
    options.body = { lines: normalizedLines };
  }
  return request(`/purchases/${id}/receive`, options);
};

export const cancelPurchase = async (purchaseId) => {
  const id = parseId(purchaseId);
  if (!id) return invalid(400, 'Identificador de compra inválido.');
  return request(`/purchases/${id}/cancel`, { method: 'POST' });
};

export const resolveLine = async (purchaseId, lineId, { resolution, note, corrected_quantity } = {}) => {
  const pId = parseId(purchaseId);
  const lId = parseId(lineId);
  if (!pId || !lId) return invalid(400, 'Identificador inválido.');
  const validResolutions = ['proveedor_completa', 'nota_de_credito', 'error_de_pesaje', 'aceptado'];
  const res = trimmed(resolution);
  if (!validResolutions.includes(res)) return invalid(422, 'Resolución no válida.', { resolution: ['Resolución no válida.'] });
  const cleanNote = trimmed(note);
  if (!cleanNote) return invalid(422, 'El motivo de la resolución es obligatorio.', { note: ['El motivo es obligatorio.'] });

  const body = { resolution: res, note: cleanNote };
  if (res === 'error_de_pesaje') {
    const qty = normalizeReceiptQuantity(corrected_quantity);
    if (qty === null) return invalid(422, 'Indica la cantidad corregida.', { corrected_quantity: ['Indica la cantidad corregida.'] });
    body.corrected_quantity = qty;
  }
  return request(`/purchases/${pId}/lines/${lId}/resolve`, { method: 'POST', body });
};

export const receiveExtra = async (purchaseId, lineId, quantity) => {
  const pId = parseId(purchaseId);
  const lId = parseId(lineId);
  if (!pId || !lId) return invalid(400, 'Identificador inválido.');
  const qty = normalizePurchaseQuantity(quantity);
  if (!qty) return invalid(422, 'La cantidad debe ser mayor que 0.', { extra_quantity: ['La cantidad debe ser mayor que 0.'] });
  return request(`/purchases/${pId}/lines/${lId}/receive-extra`, { method: 'POST', body: { extra_quantity: qty } });
};

export const listOtherPurchases = async ({ from, to, page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (DATE_FORMAT.test(trimmed(from))) params.set('from', trimmed(from));
  if (DATE_FORMAT.test(trimmed(to))) params.set('to', trimmed(to));
  pageParams(params, page);
  const qs = params.toString();
  return request(qs ? `/purchases/other?${qs}` : '/purchases/other');
};

export const getReconciliation = async (date) => {
  const cleanDate = trimmed(date);
  const params = new URLSearchParams();
  if (DATE_FORMAT.test(cleanDate)) params.set('date', cleanDate);
  const qs = params.toString();
  return request(qs ? `/purchases/reconciliation?${qs}` : '/purchases/reconciliation');
};

export const getPurchasingSettings = async () => request('/purchasing/settings');

export const updatePurchasingSettings = async (data = {}) => request('/purchasing/settings', { method: 'PUT', body: data });

export const updatePurchaseParams = async (itemId, params = {}) => {
  const id = parseId(itemId);
  if (!id) return invalid(400, 'Identificador de insumo inválido.');
  const body = {};
  const errors = {};
  if (params.base_quantity !== undefined && params.base_quantity !== null && params.base_quantity !== '') {
    const val = normalizePurchaseQuantity(params.base_quantity);
    if (!val) errors.base_quantity = ['La cantidad base debe ser mayor que 0.'];
    else body.base_quantity = val;
  } else if (params.base_quantity === null || params.base_quantity === '') {
    body.base_quantity = null;
  }
  if (params.min_stock !== undefined && params.min_stock !== null && params.min_stock !== '') {
    const val = normalizeReceiptQuantity(params.min_stock);
    if (val === null) errors.min_stock = ['El stock mínimo debe ser mayor o igual a 0.'];
    else body.min_stock = val;
  } else if (params.min_stock === null || params.min_stock === '') {
    body.min_stock = null;
  }
  if (params.reorder_point !== undefined && params.reorder_point !== null && params.reorder_point !== '') {
    const val = normalizeReceiptQuantity(params.reorder_point);
    if (val === null) errors.reorder_point = ['El punto de reorden debe ser mayor o igual a 0.'];
    else body.reorder_point = val;
  } else if (params.reorder_point === null || params.reorder_point === '') {
    body.reorder_point = null;
  }
  if (Object.keys(errors).length > 0) return invalid(422, 'Revisa los parámetros.', errors);
  return request(`/inventory/${id}/purchase-params`, { method: 'PUT', body });
};

export const getValuation = async () => request('/inventory/valuation');
