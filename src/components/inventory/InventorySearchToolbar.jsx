import React from 'react';
import { Search } from 'lucide-react';

/**
 * Barra de búsqueda y switch de inactivos para el catálogo de inventario.
 */
export default function InventorySearchToolbar({
  search,
  setSearch,
  includeInactive,
  setIncludeInactive,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glass-input"
          style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)', fontSize: '13px' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            color: 'var(--text-muted)',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            role="switch"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            style={{
              cursor: 'pointer',
              accentColor: 'var(--primary)',
              width: '14px',
              height: '14px',
            }}
          />
          <span>Mostrar inactivos</span>
        </label>
      </div>
    </div>
  );
}
