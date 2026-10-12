import { formatUsd } from '../../../services/money';
import { locationLabel } from '../../../services/inventoryLocations';

/**
 * Formato y estilos compartidos de compras y proveedores (Brief 20p). Solo
 * formatea lo que manda el motor: no suma ni divide montos.
 */

export const STATUS_LABELS = { draft: 'Borrador', received: 'Recibida', cancelled: 'Cancelada' };

export function statusLabel(status) {
  return STATUS_LABELS[status] || 'Sin dato';
}

/** "USD 87,60" o "Sin dato". */
export function money(value) {
  return value === null || value === undefined ? 'Sin dato' : formatUsd(value);
}

/** Costo unitario con hasta 6 decimales: "USD 5,625" o "Sin dato". */
export function unitCost(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Sin dato';
  return `USD ${new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(Number(value))}`;
}

export function purchaseLocation(purchase) {
  return purchase?.location_label || locationLabel(purchase?.location);
}

export { styles } from '../../common/uiStyles';
