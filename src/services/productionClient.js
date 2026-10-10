import { request } from './apiClient';
import { isValidLocation } from './inventoryLocations';

/**
 * Cliente de producción y porcionado del motor (Brief 21p).
 * Contrato: UaldoBusiness/docs/API-production.md. Las cantidades viajan como
 * texto validado; nunca se calculan aquí.
 */

const QUANTITY_FORMAT = /^\d{1,7}(\.\d{1,3})?$/;
const RUN_STATUSES = ['completed', 'voided'];
const MAX_REASON = 255;

const invalid = (status, error) => ({ ok: false, status, error, isNetworkError: false });

function parseId(value) {
  if (!/^\d+$/.test(String(value ?? '').trim())) return null;
  const parsed = parseInt(String(value).trim(), 10);
  return parsed > 0 ? parsed : null;
}

/** Texto con punto decimal y hasta 3 decimales, o null si no es válido. */
export function normalizeProductionQuantity(raw) {
  if (raw === null || raw === undefined) return null;
  const value = String(raw).trim().replace(/,/g, '.');
  return QUANTITY_FORMAT.test(value) ? value : null;
}

const isPositive = (value) => value !== null && Number(value) > 0;

export const listTemplates = async ({ includeInactive = false } = {}) => {
  return request(includeInactive ? '/production-templates?include_inactive=1' : '/production-templates');
};

export const getTemplate = async (templateId) => {
  const id = parseId(templateId);
  if (!id) return invalid(400, 'Identificador de ficha inválido.');
  return request(`/production-templates/${id}`);
};

export const getPlan = async (templateId, inputQuantity) => {
  const id = parseId(templateId);
  if (!id) return invalid(400, 'Identificador de ficha inválido.');
  const quantity = normalizeProductionQuantity(inputQuantity);
  if (!isPositive(quantity)) return invalid(422, 'La cantidad de entrada debe ser mayor que 0.');
  const params = new URLSearchParams({ input_quantity: quantity });
  return request(`/production-templates/${id}/plan?${params.toString()}`);
};

export const listRuns = async ({ templateId, status, page = 1 } = {}) => {
  const params = new URLSearchParams();
  const id = parseId(templateId);
  if (id) params.set('template_id', String(id));
  if (RUN_STATUSES.includes(status)) params.set('status', status);
  if (Number.isInteger(Number(page)) && Number(page) > 1) params.set('page', String(page));
  const qs = params.toString();
  return request(qs ? `/production-runs?${qs}` : '/production-runs');
};

export const getRun = async (runId) => {
  const id = parseId(runId);
  if (!id) return invalid(400, 'Identificador de producción inválido.');
  return request(`/production-runs/${id}`);
};

/**
 * Normaliza las líneas de entrada o salida. Las entradas deben ser mayores
 * que 0; las salidas pueden ser 0 (no salió).
 */
function normalizeLines(lines, { positive }) {
  if (!Array.isArray(lines)) return null;
  const normalized = [];
  for (const line of lines) {
    const itemId = parseId(line?.item_id);
    const quantity = normalizeProductionQuantity(line?.quantity);
    if (!itemId || quantity === null || (positive && !isPositive(quantity))) return null;
    normalized.push({ item_id: itemId, quantity });
  }
  return normalized;
}

function optionalWeight(raw) {
  if (raw === null || raw === undefined || String(raw).trim() === '') return { value: undefined };
  const value = normalizeProductionQuantity(raw);
  return value === null ? { error: true } : { value };
}

function buildRunBody(payload) {
  const templateId = parseId(payload?.templateId);
  if (!templateId) return { error: 'Ficha inválida.' };
  const location = payload.location ? String(payload.location).trim() : '';
  if (location && !isValidLocation(location)) return { error: 'Ubicación no válida.' };

  const inputs = normalizeLines(payload.inputs, { positive: true });
  if (!inputs || inputs.length === 0) return { error: 'Registra al menos una entrada mayor que 0, con 3 decimales como máximo.' };
  const outputs = normalizeLines(payload.outputs, { positive: false });
  if (!outputs || outputs.length === 0) return { error: 'Registra las salidas, con 3 decimales como máximo.' };

  const mainWeight = optionalWeight(payload.mainOutputWeight);
  const waste = optionalWeight(payload.wasteQuantity);
  if (mainWeight.error || waste.error) return { error: 'Los pesos deben estar en kg, con 3 decimales como máximo.' };

  const body = { template_id: templateId, inputs, outputs };
  if (location) body.location = location;
  if (mainWeight.value !== undefined) body.main_output_weight = mainWeight.value;
  if (waste.value !== undefined) body.waste_quantity = waste.value;
  const notes = typeof payload.notes === 'string' ? payload.notes.trim() : '';
  if (notes) body.notes = notes;
  return { body };
}

export const recordRun = async (payload, clientUuid) => {
  const { body, error } = buildRunBody(payload);
  if (error) return invalid(422, error);
  if (clientUuid) body.client_uuid = clientUuid;
  return request('/production-runs', { method: 'POST', body });
};

export const voidRun = async (runId, reason) => {
  const id = parseId(runId);
  if (!id) return invalid(400, 'Identificador de producción inválido.');
  const trimmed = typeof reason === 'string' ? reason.trim() : '';
  if (trimmed === '' || trimmed.length > MAX_REASON) return invalid(422, 'Indica el motivo de la anulación (hasta 255 caracteres).');
  return request(`/production-runs/${id}/void`, { method: 'POST', body: { reason: trimmed } });
};
