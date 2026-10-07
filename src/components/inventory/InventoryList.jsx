import React from 'react';
import { History, ArrowRightLeft } from 'lucide-react';

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
}) {
  if (activeTab === 'alerts') {
    if (alerts.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
          No hay alertas de compra activas. El stock está dentro de los niveles óptimos.
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {alerts.map(a => (
          <div
            key={a.id}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'var(--warning-soft)',
              border: '1px solid var(--warning)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                {a.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--warning)', marginTop: '2px' }}>
                Stock actual: {Number(a.stock).toFixed(3)} {a.unit} (Mínimo: {Number(a.min_stock).toFixed(3)})
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sugerido comprar:</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>
                {Number(a.suggested_qty).toFixed(3)} {a.unit}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
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
      {items.map(item => (
        <div
          key={item.id}
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'var(--bg-card)',
            border: item.is_low_stock ? '1px solid var(--warning)' : '1px solid var(--border-glass)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                {item.name}
              </span>
              {item.is_low_stock && (
                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '9999px', background: 'var(--warning-soft)', color: 'var(--warning)', fontWeight: 700 }}>
                  Bajo
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, marginTop: '2px' }}>
              {Number(item.stock).toFixed(3)} {item.unit}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => onSelectForHistory(item)}
              title="Ver historial de movimientos"
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)',
                background: 'rgba(32, 45, 47, 0.8)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <History size={16} />
            </button>

            <button
              type="button"
              onClick={() => onSelectForMovement(item)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--primary-2)',
                background: 'var(--primary)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ArrowRightLeft size={14} />
              <span>Mover</span>
            </button>
          </div>
        </div>
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
            background: 'rgba(32, 45, 47, 0.7)',
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
