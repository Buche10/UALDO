import { formatQuantity } from '../../../services/quantityFormat';
import { locationLabel } from '../../../services/inventoryLocations';

/**
 * Formato de las cifras de producción que manda el motor (Brief 21p). Solo
 * formatea: no calcula nada.
 */

/** "70 %", "-3,33 %" o "Sin dato". */
export function formatPct(value) {
  const text = formatQuantity(value);
  return text === 'Sin dato' ? text : `${text} %`;
}

/** Diferencia con signo: "+2,5 %", "-10 %", "0 %". */
export function formatSignedPct(value) {
  if (value === null || value === undefined) return 'Sin dato';
  const number = Number(value);
  return number > 0 ? `+${formatPct(value)}` : formatPct(value);
}

/** "2,8 kg" o "Sin dato". */
export function formatKg(value) {
  const text = formatQuantity(value);
  return text === 'Sin dato' ? text : `${text} kg`;
}

/** "$12,50" en es-EC, o "Sin dato". */
export function formatMoney(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Sin dato';
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(Number(value));
}

export function runLocation(run) {
  return run?.location_label || locationLabel(run?.location);
}

export function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
}
