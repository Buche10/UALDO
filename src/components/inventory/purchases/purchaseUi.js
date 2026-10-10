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

export const styles = {
  card: { padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' },
  label: { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' },
  input: { width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)', fontSize: '13px' },
  fieldError: { fontSize: '11px', color: 'var(--error)', marginTop: '4px', display: 'block' },
  back: { alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: '4px 0' },
  secondary: { padding: '10px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'var(--surface-strong)', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' },
  errorBox: { padding: '10px', borderRadius: '8px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px', border: '1px solid var(--border-error)' },
  muted: { textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' },
};
