import { request } from './apiClient';
import { listRunfoodRecipes } from './runfoodCatalogClient';

/**
 * Cliente de reservas y disponibilidad comprometida (Brief 39p).
 * Contrato: UaldoBusiness/docs/API-reservations.md. Todo pasa por apiClient.
 */

export const RESERVATION_STATUSES = ['confirmada', 'cancelada', 'cumplida', 'no_show'];
export const CLOSED_STATUSES = ['cancelada', 'cumplida', 'no_show'];
export const MIN_PARTY_SIZE = 1;
export const MAX_PARTY_SIZE = 500;
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 80;
export const MAX_CONTACT_LENGTH = 80;
export const MAX_AREA_LENGTH = 120;
export const MAX_NOTES_LENGTH = 500;
export const MAX_REASON_LENGTH = 300;
export const MAX_ITEMS = 100;
export const MAX_ITEM_QUANTITY = 500;
export const MAX_AVAILABILITY_IDS = 200;
export const MAX_DAYS_AHEAD = 365;
export const MAX_HORIZON_DAYS = 60;

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const TIME_FORMAT = /^([01]\d|2[0-3]):[0-5]\d$/;
const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const GUAYAQUIL_OFFSET = '-05:00';
const DAY_MS = 86400000;

const invalid = (status, error, errors) => ({
  ok: false,
  status,
  error,
  isNetworkError: false,
  ...(errors ? { data: { errors } } : {}),
});

const trimmed = (value) => (typeof value === 'string' ? value.trim() : '');

export function parseId(value) {
  if (!/^\d+$/.test(String(value ?? '').trim())) return null;
  const parsed = parseInt(String(value).trim(), 10);
  return parsed > 0 ? parsed : null;
}

function isRealDate(value) {
  if (!DATE_FORMAT.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isValidTime(value) {
  return TIME_FORMAT.test(String(value ?? '').trim());
}

/** Hoy en America/Guayaquil como YYYY-MM-DD. */
export function todayGuayaquil(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Convierte fecha YYYY-MM-DD y hora HH:MM a "YYYY-MM-DD HH:MM:00" o null. */
export function combineDateTime(date, time) {
  const cleanDate = trimmed(date);
  const cleanTime = trimmed(time);
  if (!isRealDate(cleanDate) || !isValidTime(cleanTime)) return null;
  return `${cleanDate} ${cleanTime}:00`;
}

/** Marca de tiempo de una fecha del motor, interpretada en Guayaquil. */
export function parseReservationDate(value) {
  const text = trimmed(value);
  if (!text) return null;
  const local = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?$/.exec(text);
  if (local) {
    if (!isRealDate(local[1]) || !isValidTime(local[2])) return null;
    return Date.parse(`${local[1]}T${local[2]}${local[3] || ':00'}${GUAYAQUIL_OFFSET}`);
  }
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Valida fecha futura y a no más de 365 días. */
export function validateReservedFor(value, now = Date.now()) {
  const timestamp = parseReservationDate(value);
  if (timestamp === null) return 'La fecha y hora de la reserva no es válida.';
  if (timestamp <= now) return 'La reserva debe ser en el futuro.';
  if (timestamp > now + MAX_DAYS_AHEAD * DAY_MS) return 'La reserva no puede ser a más de 365 días.';
  return null;
}

function validateItems(items, errors) {
  if (!Array.isArray(items)) {
    errors.items = ['Los platos deben enviarse como una lista.'];
    return [];
  }
  if (items.length > MAX_ITEMS) {
    errors.items = ['Una reserva admite hasta 100 platos.'];
    return [];
  }
  const normalized = items.map((item, index) => {
    const articleId = parseId(item?.runfood_article_id);
    const quantity = Number(item?.quantity);
    if (!articleId) errors[`items.${index}.runfood_article_id`] = ['Elige un plato válido.'];
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
      errors[`items.${index}.quantity`] = ['La cantidad debe ser un entero entre 1 y 500.'];
    }
    const notes = trimmed(item?.notes);
    const entry = { runfood_article_id: articleId, quantity };
    if (notes) entry.notes = notes;
    return entry;
  });
  return normalized;
}

function addReservedFor(body, errors, data, partial) {
  if (partial && data.reserved_for === undefined) return;
  const reservedFor = trimmed(data.reserved_for);
  const dateError = validateReservedFor(reservedFor);
  if (dateError) errors.reserved_for = [dateError];
  else body.reserved_for = reservedFor;
}

function addPartySize(body, errors, data, partial) {
  if (partial && data.party_size === undefined) return;
  const partySize = Number(data.party_size);
  if (!Number.isInteger(partySize) || partySize < MIN_PARTY_SIZE || partySize > MAX_PARTY_SIZE) {
    errors.party_size = ['Las personas deben ser un entero entre 1 y 500.'];
  } else {
    body.party_size = partySize;
  }
}

function addCustomerName(body, errors, data, partial) {
  if (partial && data.customer_name === undefined) return;
  const name = trimmed(data.customer_name);
  if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
    errors.customer_name = ['El nombre debe tener entre 2 y 80 caracteres.'];
  } else {
    body.customer_name = name;
  }
}

function addOptionalText(body, errors, data, partial) {
  ['customer_contact', 'area_note', 'notes'].forEach((field) => {
    if (partial && data[field] === undefined) return;
    const value = trimmed(data[field]);
    const limit = field === 'customer_contact' ? MAX_CONTACT_LENGTH
      : field === 'area_note' ? MAX_AREA_LENGTH : MAX_NOTES_LENGTH;
    if (value.length > limit) errors[field] = [`El texto admite hasta ${limit} caracteres.`];
    else body[field] = value || null;
  });
}

function addClientUuid(body, errors, data) {
  if (data.client_uuid === undefined) return;
  const clientUuid = trimmed(data.client_uuid);
  if (!clientUuid) return;
  if (!UUID_FORMAT.test(clientUuid)) errors.client_uuid = ['El identificador de la reserva no es válido.'];
  else body.client_uuid = clientUuid;
}

/** Cuerpo validado de una reserva; partial para editar solo lo enviado. */
export function buildReservationBody(data = {}, { partial = false } = {}) {
  const errors = {};
  const body = {};
  addReservedFor(body, errors, data, partial);
  addPartySize(body, errors, data, partial);
  addCustomerName(body, errors, data, partial);
  addOptionalText(body, errors, data, partial);
  if (!partial || data.items !== undefined) body.items = validateItems(data.items ?? [], errors);
  addClientUuid(body, errors, data);
  return { body, errors };
}

export async function listReservations({ from, to, status, page = 1 } = {}) {
  const params = new URLSearchParams();
  if (DATE_FORMAT.test(trimmed(from))) params.set('from', trimmed(from));
  if (DATE_FORMAT.test(trimmed(to))) params.set('to', trimmed(to));
  if (RESERVATION_STATUSES.includes(status)) params.set('status', status);
  if (Number.isInteger(Number(page)) && Number(page) > 1) params.set('page', String(page));
  const qs = params.toString();
  return request(qs ? `/reservations?${qs}` : '/reservations');
}

export async function getReservation(id) {
  const reservationId = parseId(id);
  if (!reservationId) return invalid(400, 'Identificador de reserva inválido.');
  return request(`/reservations/${reservationId}`);
}

export async function createReservation(data = {}) {
  const { body, errors } = buildReservationBody(data);
  if (Object.keys(errors).length > 0) return invalid(422, 'Revisa los datos de la reserva.', errors);
  return request('/reservations', { method: 'POST', body });
}

export async function updateReservation(id, data = {}) {
  const reservationId = parseId(id);
  if (!reservationId) return invalid(400, 'Identificador de reserva inválido.');
  const { body, errors } = buildReservationBody(data, { partial: true });
  if (Object.keys(errors).length > 0) return invalid(422, 'Revisa los datos de la reserva.', errors);
  return request(`/reservations/${reservationId}`, { method: 'PUT', body });
}

export async function cancelReservation(id, reason) {
  const reservationId = parseId(id);
  if (!reservationId) return invalid(400, 'Identificador de reserva inválido.');
  const cleanReason = trimmed(reason);
  if (!cleanReason) return invalid(422, 'Indica el motivo de la cancelación.', { reason: ['El motivo es obligatorio.'] });
  if (cleanReason.length > MAX_REASON_LENGTH) {
    return invalid(422, 'El motivo admite hasta 300 caracteres.', { reason: ['El motivo admite hasta 300 caracteres.'] });
  }
  return request(`/reservations/${reservationId}/cancel`, { method: 'POST', body: { reason: cleanReason } });
}

export async function setReservationStatus(id, status) {
  const reservationId = parseId(id);
  if (!reservationId) return invalid(400, 'Identificador de reserva inválido.');
  if (status !== 'cumplida' && status !== 'no_show') {
    return invalid(422, 'Estado de reserva inválido.', { status: ['Solo se admite cumplida o no vino.'] });
  }
  return request(`/reservations/${reservationId}/status`, { method: 'POST', body: { status } });
}

export async function getAvailability(itemIds) {
  if (!Array.isArray(itemIds)) return invalid(422, 'Indica entre 1 y 200 insumos.');
  const ids = Array.from(new Set(itemIds.map((id) => parseId(id)).filter(Boolean)));
  if (ids.length === 0) return invalid(422, 'Indica entre 1 y 200 insumos.');
  if (ids.length > MAX_AVAILABILITY_IDS) return invalid(422, 'Indica entre 1 y 200 insumos.');
  return request(`/inventory/availability?item_ids=${ids.join(',')}`);
}

export async function getReservationSettings() {
  return request('/reservations/settings');
}

export async function updateReservationSettings(data = {}) {
  const errors = {};
  const body = {};
  ['day_before_time', 'same_day_time'].forEach((field) => {
    if (data[field] === undefined) return;
    const value = trimmed(data[field]);
    if (!isValidTime(value)) errors[field] = ['La hora debe tener el formato HH:MM (00:00 a 23:59).'];
    else body[field] = value;
  });
  if (data.commitment_horizon_days !== undefined && data.commitment_horizon_days !== null) {
    const days = Number(data.commitment_horizon_days);
    if (!Number.isInteger(days) || days < 1 || days > MAX_HORIZON_DAYS) {
      errors.commitment_horizon_days = ['El horizonte debe ser un entero entre 1 y 60 días.'];
    } else {
      body.commitment_horizon_days = days;
    }
  }
  if (Object.keys(errors).length > 0) return invalid(422, 'Revisa los ajustes de reservas.', errors);
  return request('/reservations/settings', { method: 'PUT', body });
}

/**
 * Insumos de inventario que comprometen los platos de una reserva.
 * Usa las recetas de RunFood, que traen el mapeo confirmado por línea.
 */
export async function resolveDishInventoryItemIds(dishes = []) {
  const ids = new Set();
  for (const dish of dishes) {
    if (Array.isArray(dish.inventory_item_ids)) {
      dish.inventory_item_ids.forEach((id) => {
        const parsed = parseId(id);
        if (parsed) ids.add(parsed);
      });
      continue;
    }
    const name = trimmed(dish.name).slice(0, 60);
    if (!name) continue;
    const res = await listRunfoodRecipes({ search: name, per_page: 100 });
    if (!res.ok) continue;
    const recipes = res.data?.data || [];
    const recipe = recipes.find((row) => Number(row?.articulo_final?.runfood_id) === Number(dish.runfood_article_id));
    if (!recipe) continue;
    (recipe.lineas || []).forEach((line) => {
      const parsed = parseId(line?.mapeo?.insumo?.id);
      if (parsed && line?.mapeo?.status === 'confirmed') ids.add(parsed);
    });
  }
  return Array.from(ids).slice(0, MAX_AVAILABILITY_IDS);
}

/** Disponibilidad de los insumos comprometidos por los platos de una reserva. */
export async function getReservationAvailability(dishes = []) {
  if (!Array.isArray(dishes) || dishes.length === 0) {
    return { ok: true, status: 200, data: { data: [], horizon_days: null } };
  }
  const ids = await resolveDishInventoryItemIds(dishes);
  if (ids.length === 0) {
    return { ok: true, status: 200, data: { data: [], horizon_days: null } };
  }
  return getAvailability(ids);
}
