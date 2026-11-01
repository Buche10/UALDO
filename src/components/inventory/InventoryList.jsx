import React from 'react';
import InventoryAlertsList from './InventoryAlertsList';
import InventoryItemCard from './InventoryItemCard';

/**
 * Componente que renderiza el listado de insumos o el listado de alertas de compra.
 */
export default function InventoryList({
  activeTab,
  items,
  alerts,
  hasMore,
  loadingMore,
  onLoadMore,
  onSelectForMovement,
  onSelectForHistory,
  onSelectForTransfer,
}) {
  if (activeTab === 'alerts') {
    return <InventoryAlertsList alerts={alerts} />;
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
        No se encontraron insumos.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item) => (
        <InventoryItemCard
          key={item.id}
          item={item}
          onSelectForMovement={onSelectForMovement}
          onSelectForHistory={onSelectForHistory}
          onSelectForTransfer={onSelectForTransfer}
        />
      ))}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="glass-card-interactive"
          style={{
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid var(--border-glass)',
            background: 'var(--bg-card)',
            color: 'var(--accent)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            marginTop: '6px',
          }}
        >
          {loadingMore ? 'Cargando más...' : 'Cargar más insumos'}
        </button>
      )}
    </div>
  );
}
