import { request } from './apiClient';
import { isValidDate } from './cashCloseClient';

/**
 * Lista blanca de cubetas validas para formas de pago.
 * Excluye estrictamente 'sin_mapear' (destinado unicamente a estado inicial sin configurar).
 */
export const VALID_PAYMENT_BUCKETS = [
  'efectivo',
  'pichincha',
  'de_una',
  'internacional',
  'credito',
  'debito',
  'diners',
  'pedidos_ya',
  'decoracion_efectivo',
  'decoracion_tarjeta',
  'decoracion_transferencia',
  'ignorar'
];

/**
 * Mapeo de cubetas a etiquetas legibles en espanol.
 */
export const BUCKET_LABELS = {
  efectivo: 'Efectivo',
  pichincha: 'Pichincha',
  de_una: 'De Una',
  internacional: 'Internacional',
  credito: 'Crédito',
  debito: 'Débito',
  diners: 'Diners',
  pedidos_ya: 'Pedidos Ya',
  decoracion_efectivo: 'Decoración en efectivo',
  decoracion_tarjeta: 'Decoración con tarjeta',
  decoracion_transferencia: 'Decoración por transferencia',
  ignorar: 'Ignorar (no cuenta en la caja)',
  sin_mapear: 'Sin asignar'
};

/**
 * Lista blanca de tipos de tarjeta para tasas de comision.
 */
export const VALID_CARD_TYPES = [
  'credito',
  'debito',
  'diners',
  'pedidos_ya'
];

/**
 * Etiquetas legibles para tarjetas.
 */
export const CARD_TYPE_LABELS = {
  credito: 'Crédito',
  debito: 'Débito',
  diners: 'Diners',
  pedidos_ya: 'Pedidos Ya'
};

/**
 * Lista los mapeos de formas de pago de RunFood del negocio.
 *
 * @returns {Promise<{ok: boolean, status: number, data?: {data: Array}, error?: string}>}
 */
export async function listPaymentMappings() {
  return request('/restaurant/cash-close/payment-mappings');
}

/**
 * Asigna una forma de pago a una cubeta especifica.
 *
 * @param {number|string} id
 * @param {string} bucket
 * @returns {Promise<{ok: boolean, status: number, data?: any, error?: string}>}
 */
export async function assignBucket(id, bucket) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return {
      ok: false,
      status: 400,
      error: 'ID de forma de pago inválido.'
    };
  }

  if (typeof bucket !== 'string' || !VALID_PAYMENT_BUCKETS.includes(bucket)) {
    return {
      ok: false,
      status: 400,
      error: 'Cubeta de destino inválida o no permitida.'
    };
  }

  return request(`/restaurant/cash-close/payment-mappings/${numericId}`, {
    method: 'PUT',
    body: { bucket }
  });
}

/**
 * Acepta la cubeta sugerida para una forma de pago.
 *
 * @param {number|string} id
 * @returns {Promise<{ok: boolean, status: number, data?: any, error?: string}>}
 */
export async function acceptSuggestion(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return {
      ok: false,
      status: 400,
      error: 'ID de forma de pago inválido.'
    };
  }

  return request(`/restaurant/cash-close/payment-mappings/${numericId}/aceptar-sugerencia`, {
    method: 'POST'
  });
}

/**
 * Consulta las tasas de comision vigentes y su historial.
 *
 * @returns {Promise<{ok: boolean, status: number, data?: {current: Array, history: Array}, error?: string}>}
 */
export async function getCommissionRates() {
  return request('/restaurant/cash-close/commission-rates');
}

/**
 * Guarda una nueva vigencia de tasa de comision y retencion para una tarjeta.
 *
 * @param {{card_type: string, rate_bp: number, retention_bp: number, effective_from: string}} params
 * @returns {Promise<{ok: boolean, status: number, data?: any, error?: string}>}
 */
export async function saveCommissionRate({ card_type, rate_bp, retention_bp, effective_from }) {
  if (typeof card_type !== 'string' || !VALID_CARD_TYPES.includes(card_type)) {
    return {
      ok: false,
      status: 400,
      error: 'Tipo de tarjeta inválido.'
    };
  }

  if (!Number.isInteger(rate_bp) || rate_bp < 0 || rate_bp > 3000) {
    return {
      ok: false,
      status: 400,
      error: 'La comisión debe ser un entero entre 0 y 3000 puntos básicos (0 % a 30 %).'
    };
  }

  if (!Number.isInteger(retention_bp) || retention_bp < 0 || retention_bp > 3000) {
    return {
      ok: false,
      status: 400,
      error: 'La retención debe ser un entero entre 0 y 3000 puntos básicos (0 % a 30 %).'
    };
  }

  if (!isValidDate(effective_from)) {
    return {
      ok: false,
      status: 400,
      error: 'Fecha de vigencia inválida.'
    };
  }

  return request('/restaurant/cash-close/commission-rates', {
    method: 'PUT',
    body: {
      card_type,
      rate_bp,
      retention_bp,
      effective_from
    }
  });
}
