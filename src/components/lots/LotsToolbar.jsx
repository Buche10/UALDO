import React from 'react';
import { Search } from 'lucide-react';
import { LOT_STATUS_LABELS } from './lotFormat';

const field = { width: '100%', padding: '9px 10px', borderRadius: '9px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)', fontSize: '12px' };
const label = { display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' };

/** Búsqueda por código y filtros por estado y corte. */
export default function LotsToolbar({ search, onSearch, status, onStatus, itemId, onItemId, items = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ position: 'relative' }}>
        <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Buscar por código (L0001)"
          aria-label="Buscar lote por código"
          style={{ ...field, paddingLeft: '32px' }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label htmlFor="lots-status-filter" style={label}>Estado</label>
          <select id="lots-status-filter" value={status} onChange={(event) => onStatus(event.target.value)} style={field}>
            <option value="activo">{LOT_STATUS_LABELS.activo}</option>
            <option value="agotado">{LOT_STATUS_LABELS.agotado}</option>
            <option value="no_apto">{LOT_STATUS_LABELS.no_apto}</option>
            <option value="todos">Todos</option>
          </select>
        </div>
        <div>
          <label htmlFor="lots-item-filter" style={label}>Corte</label>
          <select id="lots-item-filter" value={itemId} onChange={(event) => onItemId(event.target.value)} style={field}>
            <option value="">Todos los cortes</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
