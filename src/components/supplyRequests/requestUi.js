import { formatQuantity } from '../../services/quantityFormat';

/**
 * Textos y formato de los pedidos internos (Brief 22p). Solo formatea lo que
 * manda el motor.
 */

export const STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  purchased: 'Comprado',
  received: 'Recibido',
  cancelled: 'Cancelado',
};

export const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobados' },
  { value: 'purchased', label: 'Comprados' },
  { value: 'received', label: 'Recibidos' },
  { value: 'rejected', label: 'Rechazados' },
  { value: 'cancelled', label: 'Cancelados' },
];

export function statusLabel(status) {
  return STATUS_LABELS[status] || 'Sin dato';
}

/** Primer nombre del solicitante; nunca el nombre completo. */
export function requesterName(request) {
  const name = String(request?.requester?.name || '').trim();
  return name ? name.split(/\s+/)[0] : 'Personal';
}

export function formatDateTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
}

/** "5 kg" o "Sin dato". */
export function quantityWithUnit(quantity, unit) {
  const text = formatQuantity(quantity);
  return text === 'Sin dato' ? text : `${text} ${unit || ''}`.trim();
}

export function itemsCount(request) {
  const count = (request?.items || []).length;
  return count === 1 ? '1 insumo' : `${count} insumos`;
}
