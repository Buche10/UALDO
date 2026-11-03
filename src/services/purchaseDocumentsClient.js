import { request, requestBlob, uploadFile } from './apiClient';
import { normalizeAmount } from './money';
import { normalizePurchaseQuantity, parseId } from './purchasesClient';

/**
 * Cliente de facturas electrónicas del SRI y recibos con visión (Brief 34ap / 34bp).
 * Contrato: UaldoBusiness/docs/API-purchase-documents.md.
 */

const MAX_XML_BYTES = 1024 * 1024;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCESS_KEY_LENGTH = 49;
const XML_MIME_TYPES = new Set(['text/xml', 'application/xml']);
const ALLOWED_FILE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const ALLOWED_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
const DOCUMENT_STATUSES = ['queued', 'processing', 'extracted', 'failed'];

const invalid = (status, error) => ({ ok: false, status, error, isNetworkError: false });

/** Desenvuelve el sobre { data: ... } y conserva duplicate, purchase y meta. */
function unwrap(res) {
  if (res && res.ok && res.data && typeof res.data === 'object' && 'data' in res.data) {
    const { data, ...rest } = res.data;
    return { ...res, data, ...rest };
  }
  return res;
}

/** Quita espacios y guiones de una clave de acceso. */
export function normalizeAccessKey(raw) {
  return String(raw ?? '').replace(/[\s-]/g, '');
}

function hasValidVerifier(key) {
  let sum = 0;
  let weight = 2;
  for (let index = 47; index >= 0; index -= 1) {
    sum += Number(key[index]) * weight;
    weight = weight === 7 ? 2 : weight + 1;
  }
  let digit = 11 - (sum % 11);
  if (digit === 11) digit = 0;
  if (digit === 10) digit = 1;
  return Number(key[48]) === digit;
}

/** Error legible de una clave en edición, o null si aún no aplica. */
export function accessKeyError(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  const key = normalizeAccessKey(value);
  if (!/^\d+$/.test(key)) return 'La clave solo admite números, espacios y guiones.';
  if (key.length !== ACCESS_KEY_LENGTH) return null;
  if (key.slice(8, 10) !== '01') return 'Esa clave no corresponde a una factura.';
  if (!hasValidVerifier(key)) return 'La clave de acceso no es válida. Revisa los 49 dígitos.';
  return null;
}

/** Clave de 49 dígitos, de factura y con verificador correcto. */
export function isValidSriAccessKey(raw) {
  const key = normalizeAccessKey(raw);
  return /^\d{49}$/.test(key) && accessKeyError(key) === null;
}

/** Líneas de confirmación: source_index solo en las que vienen de la factura. */
export function buildConfirmLines(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { lines: [], error: 'Agrega al menos una línea.' };
  }
  const normalized = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] || {};
    const quantity = normalizePurchaseQuantity(line.quantity);
    const lineTotal = normalizeAmount(line.line_total);
    if (!quantity) return { lines: [], error: `La línea ${index + 1} tiene una cantidad inválida.` };
    if (lineTotal === null) return { lines: [], error: `La línea ${index + 1} tiene un total inválido.` };

    const entry = { quantity, line_total: lineTotal };
    if (line.source_index !== undefined && line.source_index !== null) {
      const sourceIndex = Number(line.source_index);
      if (!Number.isInteger(sourceIndex) || sourceIndex < 0) {
        return { lines: [], error: `La línea ${index + 1} no corresponde a la factura.` };
      }
      entry.source_index = sourceIndex;
    }
    const unitFactor = String(line.unit_factor ?? '').trim();
    if (unitFactor) {
      if (!/^\d+(\.\d{1,3})?$/.test(unitFactor) || Number(unitFactor) <= 0) {
        return { lines: [], error: `El factor de la línea ${index + 1} no es válido.` };
      }
      entry.unit_factor = unitFactor;
    }

    if (line.is_other) {
      const name = String(line.free_text_name ?? '').trim();
      const note = String(line.note ?? '').trim();
      if (!name) return { lines: [], error: `La línea ${index + 1} necesita un nombre.` };
      if (!note) return { lines: [], error: `La línea ${index + 1} necesita un motivo.` };
      normalized.push({
        ...entry,
        is_other: true,
        free_text_name: name,
        note,
        unit: String(line.unit ?? '').trim() || 'unidad',
      });
    } else {
      const itemId = parseId(line.item_id);
      if (!itemId) return { lines: [], error: `La línea ${index + 1} necesita un insumo.` };
      normalized.push({ ...entry, item_id: itemId });
    }
  }
  return { lines: normalized, error: null };
}

/** POST /purchase-documents (multipart, campo file con XML). */
export const uploadInvoiceXml = async (file) => {
  if (!file || typeof file.name !== 'string') return invalid(422, 'Elige un archivo XML.');
  const extension = file.name.toLowerCase();
  const mime = String(file.type || '').toLowerCase();
  if (!extension.endsWith('.xml') || (mime && !XML_MIME_TYPES.has(mime))) {
    return invalid(422, 'Solo se acepta un archivo XML.');
  }
  if (Number(file.size) > MAX_XML_BYTES) {
    return invalid(422, 'El archivo XML no puede superar 1 MB.');
  }
  return unwrap(await uploadFile('/purchase-documents', file));
};

/** POST /purchase-documents (multipart, campo file con foto o PDF). */
export const uploadInvoiceFile = async (file) => {
  if (!file || typeof file.name !== 'string') return invalid(422, 'Elige una foto o un PDF.');
  const extension = file.name.toLowerCase();
  const mime = String(file.type || '').toLowerCase();
  const hasValidExt = ALLOWED_FILE_EXTENSIONS.some((ext) => extension.endsWith(ext));
  const hasValidMime = mime ? ALLOWED_FILE_MIMES.has(mime) : hasValidExt;

  if (!hasValidExt || !hasValidMime) {
    return invalid(422, 'El archivo debe ser una foto (JPG, PNG o WEBP) o un PDF.');
  }
  if (Number(file.size) > MAX_FILE_BYTES) {
    return invalid(422, 'El archivo no puede superar 10 MB.');
  }
  return unwrap(await uploadFile('/purchase-documents', file));
};

/** GET /purchase-documents/{id}/file (descarga streaming como Blob pasando por apiClient). */
export const invoiceFileBlob = async (documentId) => {
  const id = parseId(documentId);
  if (!id) return null;
  const res = await requestBlob(`/purchase-documents/${id}/file`);
  return res.ok && res.blob ? res.blob : null;
};

/** POST /purchase-documents/access-key. */
export const submitAccessKey = async (raw) => {
  const key = normalizeAccessKey(raw);
  if (key.length !== ACCESS_KEY_LENGTH) {
    return invalid(422, 'La clave de acceso no es válida. Revisa los 49 dígitos.');
  }
  const error = accessKeyError(key);
  if (error) return invalid(422, error);
  return unwrap(await request('/purchase-documents/access-key', { method: 'POST', body: { access_key: key } }));
};

/** GET /purchase-documents/{id}. */
export const getInvoiceDocument = async (documentId) => {
  const id = parseId(documentId);
  if (!id) return invalid(400, 'Identificador de factura inválido.');
  return unwrap(await request(`/purchase-documents/${id}`));
};

/** GET /purchase-documents?status=&page=. */
export const listInvoiceDocuments = async ({ status = '', page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (DOCUMENT_STATUSES.includes(status)) params.set('status', status);
  if (Number.isInteger(Number(page)) && Number(page) > 1) params.set('page', String(page));
  const qs = params.toString();
  return unwrap(await request(qs ? `/purchase-documents?${qs}` : '/purchase-documents'));
};

/** POST /purchase-documents/{id}/confirm. */
export const confirmInvoice = async (documentId, { supplier_id, lines } = {}) => {
  const id = parseId(documentId);
  if (!id) return invalid(400, 'Identificador de factura inválido.');
  const supplierId = parseId(supplier_id);
  if (!supplierId) return invalid(422, 'Elige o crea el proveedor.');
  const built = buildConfirmLines(lines);
  if (built.error) return invalid(422, built.error);
  return unwrap(await request(`/purchase-documents/${id}/confirm`, {
    method: 'POST',
    body: { supplier_id: supplierId, lines: built.lines },
  }));
};
