import React from 'react';
import { Plus, ClipboardList, Scissors } from 'lucide-react';

const secondaryButton = {
  padding: '8px 12px',
  fontSize: '12px',
  borderRadius: '9999px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  border: '1px solid var(--border-glass)',
  background: 'var(--surface-strong)',
  color: 'var(--accent)',
  cursor: 'pointer',
  fontWeight: 600,
};

/**
 * Acciones de la cabecera de Inventario. "Producción" es para cualquier
 * miembro (Brief 21p); "Conteos" y "Nuevo Insumo", solo para el dueño.
 */
export default function InventoryHeaderActions({ isOwner, onProduction, onCounts, onCreate }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      <button type="button" className="glass-card-interactive" onClick={onProduction} style={secondaryButton}>
        <Scissors size={16} />
        <span>Producción</span>
      </button>

      {isOwner && (
        <>
          <button type="button" className="glass-card-interactive" onClick={onCounts} style={secondaryButton}>
            <ClipboardList size={16} />
            <span>Conteos</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onCreate}
            style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>Nuevo Insumo</span>
          </button>
        </>
      )}
    </div>
  );
}
