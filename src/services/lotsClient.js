import { request } from './apiClient';
import { isValidLocation } from './inventoryLocations';
import { normalizeLotJustification } from './lotSelection';

/**
 * Cliente de lotes de carne y rotación FIFO (Brief 40p).
 * Contrato: UaldoBusiness/docs/API-lots.md. Todo pasa por apiClient y los
 * errores del motor se devuelven sin traducir.
 */

export const LOT_CODE_PATTERN = /^L\d{4,}$/;
export const LOT_STATUSES = Object.freeze(['activo', 'agotado', 'no_apto']);
export const DEFAULT_AGE_ALERT_DAYS = 5;
const MAX_AGE_ALERT_DAYS = 365;

const invalid = (status, error, errors) => ({
  ok: false,
  status,
  error,
  isNetworkError: false,
  ...(errors ? { data: { errors } } : {}),
});

export function parseLotId(value) {
  if (!/^\d+$/.test(String(value ?? '').trim())) return null;
  const parsed = parseInt(String(value).trim(), 10);
  return parsed > 0 ? parsed : null;
}

export function isValidLotCode(value) {
  return typeof value === 'string' && LOT_CODE_PATTERN.test(value.trim());
}

/** Días de aviso de antigüedad válidos (entero positivo) o null. */
export function normalizeAgeAlertDays(raw) {
  if (!/^\d+$/.test(String(raw ?? '').trim())) return null;
  const days = parseInt(String(raw).trim(), 10);
  return days > 0 && days <= MAX_AGE_ALERT_DAYS ? days : null;
}

export const listLots = async ({ itemId, status, location, page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (itemId !== undefined && itemId !== null && itemId !== '') {
    const id = parseLotId(itemId);
    if (!id) return invalid(400, 'Identificador de insumo inválido.');
    params.set('item_id', String(id));
  }
  if (status !== undefined && status !== null && status !== '') {
    if (!LOT_STATUSES.includes(status)) return invalid(422, 'Estado de lote no válido.');
    params.set('status', status);
  }
  if (location !== undefined && location !== null && location !== '') {
    if (!isValidLocation(location)) return invalid(422, 'Ubicación de inventario no válida.');
    params.set('location', String(location).trim());
  }
  if (Number.isInteger(Number(page)) && Number(page) > 1) params.set('page', String(page));
  const qs = params.toString();
  return request(qs ? `/lots?${qs}` : '/lots');
};

export const getNextLot = async (itemId, location) => {
  const id = parseLotId(itemId);
  if (!id) return invalid(400, 'Identificador de insumo inválido.');
  const params = new URLSearchParams({ item_id: String(id) });
  if (location !== undefined && location !== null && location !== '') {
    if (!isValidLocation(location)) return invalid(422, 'Ubicación de inventario no válida.');
    params.set('location', String(location).trim());
  }
  return request(`/lots/next?${params.toString()}`);
};

export const getLot = async (lotId, page = 1) => {
  const id = parseLotId(lotId);
  if (!id) return invalid(400, 'Identificador de lote inválido.');
  const params = new URLSearchParams();
  if (Number.isInteger(Number(page)) && Number(page) > 1) params.set('page', String(page));
  const qs = params.toString();
  return request(qs ? `/lots/${id}?${qs}` : `/lots/${id}`);
};

export const markLotUnfit = async (lotId, reason) => {
  const id = parseLotId(lotId);
  if (!id) return invalid(400, 'Identificador de lote inválido.');
  const cleanReason = normalizeLotJustification(reason);
  if (!cleanReason) {
    return invalid(422, 'Indica el motivo por el que el lote no es apto.', {
      reason: ['Indica el motivo por el que el lote no es apto.'],
    });
  }
  return request(`/lots/${id}/unfit`, { method: 'POST', body: { reason: cleanReason } });
};

export const setRequiresLot = async (itemId, value) => {
  const id = parseLotId(itemId);
  if (!id) return invalid(400, 'Identificador de insumo inválido.');
  if (typeof value !== 'boolean') return invalid(422, 'Indica si el insumo controla lote.');
  return request(`/inventory/${id}/requires-lot`, {
    method: 'PUT',
    body: { requires_lot: value },
  });
};

export const getLotSettings = async () => request('/lots/settings');

export const updateLotSettings = async (data = {}) => {
  const ageAlertDays = normalizeAgeAlertDays(data.age_alert_days);
  if (ageAlertDays === null) {
    return invalid(422, 'Los días de aviso deben ser un entero entre 1 y 365.', {
      age_alert_days: ['Los días de aviso deben ser un entero entre 1 y 365.'],
    });
  }
  return request('/lots/settings', {
    method: 'PUT',
    body: { age_alert_days: ageAlertDays },
  });
};
