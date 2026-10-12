import React from 'react';
import { Plus } from 'lucide-react';
import { styles } from '../common/uiStyles';
import { formatDateTime, itemsCount, requesterName, statusLabel, STATUS_FILTERS } from './requestUi';

/**
 * Pedidos internos (Brief 22p): el dueño ve todos; el personal, los suyos.
 */
export default function SupplyRequestList({ list, status, onStatusChange, onOpen, onNew, isOwner }) {
  const { items, loading, error, hasMore, loadMore, reload } = list;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="request-status-filter" style={styles.label}>Estado</label>
          <select id="request-status-filter" value={status} onChange={(e) => onStatusChange(e.target.value)} style={styles.input}>
            {STATUS_FILTERS.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
          </select>
        </div>
        <button type="button" onClick={onNew} className="btn-primary" style={{ padding: '10px 14px', fontSize: '12px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} />
          <span>Nuevo pedido</span>
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
        <div style={styles.muted}>Cargando pedidos...</div>
      ) : items.length === 0 && !error ? (
        <div style={styles.muted}>{isOwner ? 'No hay pedidos con este filtro.' : 'Todavía no tienes pedidos con este filtro.'}</div>
      ) : (
        items.map((request) => (
          <button key={request.id} type="button" onClick={() => onOpen(request)} className="glass-card-interactive" style={{ ...styles.card, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: '10px', color: 'var(--text-main)' }}>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>
                {requesterName(request)}, {itemsCount(request)}
              </span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>{formatDateTime(request.created_at)}</span>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600, background: 'var(--chip-bg)', color: 'var(--accent)' }}>{statusLabel(request.status)}</span>
              {request.priority === 'urgent' && <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--warning)' }}>Urgente</span>}
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
