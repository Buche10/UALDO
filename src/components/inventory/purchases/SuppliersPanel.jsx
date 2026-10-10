import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSuppliers } from '../../../hooks/usePurchasesData';
import SupplierForm from './SupplierForm';
import { styles } from './purchaseUi';

/**
 * Proveedores del negocio: búsqueda, inactivos, alta y edición (Brief 20p).
 */
export default function SuppliersPanel() {
  const [search, setSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [editing, setEditing] = useState(null);
  const list = useSuppliers({ search, includeInactive });

  if (editing) {
    return (
      <SupplierForm
        supplier={editing === 'new' ? null : editing}
        onBack={() => setEditing(null)}
        onSaved={(saved) => { list.upsert(saved); setEditing(null); }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="supplier-search" style={styles.label}>Buscar proveedor</label>
          <input id="supplier-search" type="text" value={search} onChange={(e) => setSearch(e.target.value)} style={styles.input} />
        </div>
        <button type="button" onClick={() => setEditing('new')} className="btn-primary" style={{ padding: '10px 14px', fontSize: '12px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} />
          <span>Nuevo proveedor</span>
        </button>
      </div>

      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
        <input type="checkbox" role="switch" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
        <span>Incluir inactivos</span>
      </label>

      <div aria-live="polite">{list.error && <div style={styles.errorBox}>{list.error}</div>}</div>

      {list.loading && list.items.length === 0 ? (
        <div style={styles.muted}>Cargando proveedores...</div>
      ) : list.items.length === 0 && !list.error ? (
        <div style={styles.muted}>No hay proveedores.</div>
      ) : (
        list.items.map((supplier) => (
          <button key={supplier.id} type="button" onClick={() => setEditing(supplier)} className="glass-card-interactive" style={{ ...styles.card, textAlign: 'left', cursor: 'pointer', color: 'var(--text-main)' }}>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>
              {supplier.name}{supplier.is_active ? '' : ' (inactivo)'}
            </span>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
              {[supplier.tax_id, supplier.contact_name, supplier.phone].filter(Boolean).join(', ') || 'Sin datos de contacto'}
            </span>
          </button>
        ))
      )}

      {list.hasMore && (
        <button type="button" onClick={list.loadMore} disabled={list.loading} style={{ ...styles.secondary, color: 'var(--accent)', fontSize: '12px' }}>
          {list.loading ? 'Cargando más...' : 'Cargar más'}
        </button>
      )}
    </div>
  );
}
