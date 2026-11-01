import { formatQuantity } from '../../services/quantityFormat';

/**
 * Textos y formato de los pedidos internos (Brief 22p / 26p / 30p). Solo formatea lo que
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
  if (request?.requester_first_name) {
    return String(request.requester_first_name).trim();
  }
  const name = String(request?.requester?.name || '').trim();
  return name ? name.split(/\s+/)[0] : 'Personal';
}

export function formatDateTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
}

/** Formato relativo para horas de reportes ("hoy 21:40", "ayer 22:05"). */
export function formatRelativeTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const timeStr = d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });

  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return `hoy ${timeStr}`;
  if (isYesterday) return `ayer ${timeStr}`;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month} ${timeStr}`;
}

/** "5 kg" o "Cantidad por definir" (Brief 26p). */
export function quantityWithUnit(quantity, unit) {
  if (quantity === null || quantity === undefined || quantity === '') {
    return 'Cantidad por definir';
  }
  const text = formatQuantity(quantity);
  return text === 'Sin dato' ? 'Cantidad por definir' : `${text} ${unit || ''}`.trim();
}

export function itemsCount(request) {
  const count = (request?.items || []).length;
  return count === 1 ? '1 insumo' : `${count} insumos`;
}

/** Acciones posibles según permisos y estado, como en el motor (Brief 30p). */
export function availableActions(request, { canDecide = false, userId } = {}) {
  if (canDecide) {
    if (request.status === 'pending') return ['approve', 'reject', 'cancel'];
    if (request.status === 'approved') return ['purchased', 'cancel'];
    if (request.status === 'purchased') return ['received'];
    return [];
  }
  return request.status === 'pending' && Number(request.requested_by) === Number(userId) ? ['cancel'] : [];
}
