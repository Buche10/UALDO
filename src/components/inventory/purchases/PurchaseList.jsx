import React from 'react';
import { Plus } from 'lucide-react';
import { money, statusLabel, styles } from './purchaseUi';

const FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'draft', label: 'Borradores' },
  { value: 'received', label: 'Recibidas' },
  { value: 'cancelled', label: 'Canceladas' },
];

/**
 * Compras del negocio, de la más reciente a la más antigua (Brief 20p).
 */
export default function PurchaseList({ list, status, onStatusChange, onOpen, onNew }) {
  const { items, loading, error, hasMore, loadMore, reload } = list;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="purchase-status-filter" style={styles.label}>Estado</label>
          <select id="purchase-status-filter" value={status} onChange={(e) => onStatusChange(e.target.value)} style={styles.input}>
            {FILTERS.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
          </select>
        </div>
        <button type="button" onClick={onNew} className="btn-primary" style={{ padding: '10px 14px', fontSize: '12px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} />
          <span>Nueva compra</span>
        </button>
      </div>

      <div aria-live="polite">
        {error && (
          <div style={{ ...styles.errorBox, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span>{error}</span>
            <button type="button" onClick={reload} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '9999px' }}>Reintentar</button>
          </div>
        )}
      </div>

      {loading && items.length === 0 ? (
        <div style={styles.muted}>Cargando compras...</div>
      ) : items.length === 0 && !error ? (
        <div style={styles.muted}>No hay compras con este filtro.</div>
      ) : (
        items.map((purchase) => (
          <button key={purchase.id} type="button" onClick={() => onOpen(purchase)} className="glass-card-interactive" style={{ ...styles.card, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: '10px', color: 'var(--text-main)' }}>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>{purchase.supplier?.name || 'Proveedor'}</span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                {purchase.purchased_on}{purchase.invoice_number ? `, factura ${purchase.invoice_number}` : ''}
              </span>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600, background: 'var(--chip-bg)', color: 'var(--accent)' }}>{statusLabel(purchase.status)}</span>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>{money(purchase.total)}</span>
            </span>
          </button>
        ))
      )}

      {hasMore && (
        <button type="button" onClick={loadMore} disabled={loading} style={{ ...styles.secondary, color: 'var(--accent)', fontSize: '12px' }}>
          {loading ? 'Cargando más...' : 'Cargar más'}
        </button>
      )}
    </div>
  );
}
