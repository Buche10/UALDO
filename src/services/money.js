/**
 * Normalizacion y formateo de montos de dinero para la PWA de Ualdo.
 * Sin calculos financieros en el cliente: todos los totales, diferencias
 * y estados provienen directamente del motor.
 */

/**
 * Normaliza y valida un monto en dolares.
 * Acepta coma decimal, valida formato ^\d{1,7}(\.\d{1,2})?$ y devuelve string ("12.5").
 * Para movimientos, valida ademas que sea estrictamente mayor a 0 y hasta 100000.
 *
 * @param {string|number} raw
 * @param {boolean|{isMovement?: boolean}} [options]
 * @returns {string|null}
 */
export function normalizeAmount(raw, options = false) {
  if (raw === null || raw === undefined) {
    return null;
  }

  const isMovement = typeof options === 'boolean' ? options : Boolean(options?.isMovement);

  const str = String(raw).trim().replace(',', '.');
  if (!str) {
    return null;
  }

  if (!/^\d{1,7}(\.\d{1,2})?$/.test(str)) {
    return null;
  }

  const num = Number(str);
  if (!Number.isFinite(num)) {
    return null;
  }

  if (isMovement) {
    if (num <= 0 || num > 100000) {
      return null;
    }
  }

  return str;
}

const usdFormatter = new Intl.NumberFormat('es-EC', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/**
 * Formatea un valor numerico del motor como "USD 1.234,56" (separadores es-EC).
 * Si el valor es null o undefined, devuelve "Pendiente".
 *
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
export function formatUsd(value) {
  if (value === null || value === undefined) {
    return 'Pendiente';
  }

  const num = Number(value);
  if (!Number.isFinite(num)) {
    return 'Pendiente';
  }

  return `USD ${usdFormatter.format(num)}`;
}

/**
 * Convierte un porcentaje en formato de texto a puntos basicos (enteros).
 * Acepta "4,48" o "4.48" con maximo 2 decimales, entre 0 y 30 (0 a 3000 bp).
 * Realiza conversion aritmetica de texto SIN multiplicar floats.
 *
 * @param {string|number|null|undefined} raw
 * @returns {number|null}
 */
export function percentToBp(raw) {
  if (raw === null || raw === undefined) {
    return null;
  }

  const str = String(raw).trim().replace(',', '.');
  if (!str) {
    return null;
  }

  // Validar formato estricto: uno o dos digitos enteros, opcionalmente punto y 1 o 2 decimales
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(str)) {
    return null;
  }

  const [intPartStr, decPartStr = ''] = str.split('.');
  const intPart = parseInt(intPartStr, 10);
  const decPart = parseInt(decPartStr.padEnd(2, '0'), 10);

  const bp = intPart * 100 + decPart;

  if (bp < 0 || bp > 3000) {
    return null;
  }
  return bp;
}

/**
 * Convierte puntos basicos (bp) al porcentaje formateado para visualizacion.
 * Ejemplo: 448 -> "4,48 %", 200 -> "2,00 %", 0 -> "0,00 %", null/undefined -> "Sin tasa".
 *
 * @param {number|null|undefined} bp
 * @returns {string}
 */
export function bpToPercent(bp) {
  if (bp === null || bp === undefined || !Number.isInteger(bp) || bp < 0) {
    return 'Sin tasa';
  }

  const intPart = Math.floor(bp / 100);
  const decPart = String(bp % 100).padStart(2, '0');

  return `${intPart},${decPart} %`;
}

/**
 * Calcula el ticket promedio (total / pedidos) usando aritmética exacta de enteros en centavos.
 * Sin operaciones de punto flotante para montos.
 *
 * @param {string|number|null|undefined} total  Monto total en dólares (texto o número)
 * @param {number|string|null|undefined} pedidos  Cantidad entera de pedidos
 * @returns {string} Monto promedio con 2 decimales ("33.33" o "0.00")
 */
export function calculateAverageTicket(total, pedidos) {
  const p = typeof pedidos === 'number' ? pedidos : parseInt(String(pedidos || '0'), 10);
  if (!Number.isFinite(p) || p <= 0) {
    return '0.00';
  }

  const norm = normalizeAmount(total);
  if (!norm) {
    return '0.00';
  }

  const [intPart, decPart = ''] = norm.split('.');
  const totalCents = parseInt(intPart, 10) * 100 + parseInt(decPart.padEnd(2, '0').slice(0, 2), 10);
  const avgCents = Math.round(totalCents / p);
  const avgInt = Math.floor(avgCents / 100);
  const avgDec = String(avgCents % 100).padStart(2, '0');

  return `${avgInt}.${avgDec}`;
}
