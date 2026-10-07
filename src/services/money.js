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
