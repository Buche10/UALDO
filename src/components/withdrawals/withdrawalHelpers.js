import { can, ABILITIES } from '../../services/permissions';

/**
 * Catálogo de etiquetas legibles por ubicación.
 */
export function getLocationLabel(loc) {
  if (loc === 'kitchen') return 'Cocina';
  if (loc === 'lounge') return 'Salón';
  if (loc === 'warehouse') return 'Bodega';
  return loc || 'Área';
}

/**
 * Devuelve el primer nombre de un nombre completo.
 */
export function getFirstName(fullName) {
  if (!fullName || typeof fullName !== 'string') return 'Alguien';
  return fullName.trim().split(' ')[0] || 'Alguien';
}

/**
 * Colores y textos para los badges de estado de un retiro (Brief 32p).
 */
export function getWithdrawalStatusBadge(status) {
  switch (status) {
    case 'open':
      return { text: 'Abierto', bg: 'var(--warning-soft)', border: 'var(--border-warning)', color: 'var(--warning)' };
    case 'escalated':
      return { text: 'Escalado', bg: 'var(--error-soft)', border: 'var(--border-error)', color: 'var(--error)' };
    case 'closed':
      return { text: 'Cerrado', bg: 'var(--success-soft)', border: 'var(--border-success)', color: 'var(--success)' };
    case 'cancelled':
      return { text: 'Cancelado', bg: 'var(--surface-soft)', border: 'var(--border-glass)', color: 'var(--text-muted)' };
    default:
      return { text: status || 'Desconocido', bg: 'var(--surface-soft)', border: 'var(--border-glass)', color: 'var(--text-muted)' };
  }
}

/**
 * Determina si el usuario actual puede cancelar el retiro y bajo qué condiciones.
 * - Autor: en los primeros 15 minutos puede cancelar sin nota.
 * - Supervisor (withdrawals.supervise / admin / owner): puede cancelar en cualquier momento, con nota obligatoria tras 15 minutos.
 */
export function getCancelCapability(withdrawal, currentUser) {
  if (!withdrawal || !currentUser) {
    return { canCancel: false, remainingMinutes: 0, requiresNote: false, isAuthor: false };
  }

  if (withdrawal.status !== 'open') {
    return { canCancel: false, remainingMinutes: 0, requiresNote: false, isAuthor: false };
  }

  const createdTime = new Date(withdrawal.created_at || withdrawal.withdrawn_at || Date.now()).getTime();
  const diffMinutes = Math.floor((Date.now() - createdTime) / 60000);
  const remainingMinutes = Math.max(0, 15 - diffMinutes);

  const isAuthor = Number(withdrawal.user?.id || withdrawal.user_id) === Number(currentUser.id);
  const isSupervisor = can(currentUser, ABILITIES.WITHDRAWALS_SUPERVISE) ||
    Boolean(currentUser.is_owner || currentUser.role === 'owner' || currentUser.role === 'admin');

  if (isAuthor && diffMinutes < 15) {
    return { canCancel: true, remainingMinutes, requiresNote: false, isAuthor: true };
  }

  if (isSupervisor) {
    return { canCancel: true, remainingMinutes: 0, requiresNote: diffMinutes >= 15, isAuthor };
  }

  return { canCancel: false, remainingMinutes: 0, requiresNote: false, isAuthor };
}

/**
 * Cuenta los retiros propios pendientes de cierre (open o escalated).
 */
export function countMyPendingWithdrawals(list = [], userId) {
  if (!Array.isArray(list) || !userId) return 0;
  return list.filter((w) => {
    const isOwner = Number(w.user?.id || w.user_id) === Number(userId);
    const isPending = w.status === 'open' || w.status === 'escalated';
    return isOwner && isPending;
  }).length;
}

