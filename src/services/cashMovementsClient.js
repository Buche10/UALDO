import { request } from './apiClient';
import { isValidDate } from './cashCloseClient';
import { normalizeAmount } from './money';

export const CASH_MOVEMENT_KINDS = [
  'pago_transferencia',
  'pago_efectivo',
  'caja_chica',
  'deposito',
  'a_justificar',
  'cheque'
];

export const REQUIRED_COUNTERPARTY_KINDS = new Set([
  'pago_transferencia',
  'pago_efectivo',
  'cheque'
]);

/**
 * Consulta los movimientos de caja de un dia determinado.
 *
 * @param {string} fecha
 * @param {number} [page=1]
 */
export async function listMovements(fecha, page = 1) {
  if (!isValidDate(fecha)) {
    return {
      ok: false,
      status: 400,
      error: 'Fecha invalida. Debe tener formato AAAA-MM-DD y ser una fecha real.'
    };
  }

  const parsedPage = Number(page);
  const safePage = Number.isInteger(parsedPage) && parsedPage > 1 ? parsedPage : 1;

  const params = new URLSearchParams({ date: fecha });
  if (safePage > 1) {
    params.set('page', String(safePage));
  }

  return request(`/restaurant/cash-movements?${params.toString()}`);
}

/**
 * Registra un nuevo movimiento de caja con soporte de idempotencia por client_uuid.
 *
 * @param {Object} payload
 * @param {string} payload.business_date
 * @param {string} payload.kind
 * @param {string} [payload.counterparty]
 * @param {string|number} payload.amount
 * @param {string} [payload.note]
 * @param {string} [clientUuid]
 */
export async function createMovement(payload = {}, clientUuid = '') {
  const { business_date, kind, counterparty = '', amount, note = '' } = payload;

  if (!isValidDate(business_date)) {
    return {
      ok: false,
      status: 400,
      error: 'Fecha invalida para el movimiento.'
    };
  }

  if (!CASH_MOVEMENT_KINDS.includes(kind)) {
    return {
      ok: false,
      status: 400,
      error: 'Tipo de movimiento invalido.'
    };
  }

  const trimmedCounterparty = typeof counterparty === 'string' ? counterparty.trim() : '';
  if (REQUIRED_COUNTERPARTY_KINDS.has(kind)) {
    if (!trimmedCounterparty) {
      return {
        ok: false,
        status: 400,
        error: 'La contraparte es obligatoria para este tipo de movimiento.'
      };
    }
  }

  if (trimmedCounterparty.length > 120) {
    return {
      ok: false,
      status: 400,
      error: 'La contraparte no debe superar 120 caracteres.'
    };
  }

  const normAmount = normalizeAmount(amount, true);
  if (!normAmount) {
    return {
      ok: false,
      status: 400,
      error: 'El monto debe ser un numero positivo hasta 100000 con maximo 2 decimales.'
    };
  }

  const trimmedNote = typeof note === 'string' ? note.trim() : '';
  if (trimmedNote.length > 200) {
    return {
      ok: false,
      status: 400,
      error: 'La nota no debe superar 200 caracteres.'
    };
  }

  const body = {
    business_date,
    kind,
    counterparty: trimmedCounterparty,
    amount: normAmount,
    note: trimmedNote
  };

  const uuid = clientUuid || payload.client_uuid;
  if (uuid) {
    body.client_uuid = uuid;
  }

  return request('/restaurant/cash-movements', {
    method: 'POST',
    body
  });
}

/**
 * Anula un movimiento de caja existente indicando el motivo.
 *
 * @param {number|string} id
 * @param {string} motivo
 */
export async function voidMovement(id, motivo) {
  const parsedId = Number(id);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return {
      ok: false,
      status: 400,
      error: 'ID de movimiento invalido.'
    };
  }

  if (!motivo || typeof motivo !== 'string' || !motivo.trim() || motivo.trim().length > 200) {
    return {
      ok: false,
      status: 400,
      error: 'El motivo de anulacion es obligatorio (hasta 200 caracteres).'
    };
  }

  return request(`/restaurant/cash-movements/${encodeURIComponent(parsedId)}/anular`, {
    method: 'POST',
    body: { motivo: motivo.trim() }
  });
}
