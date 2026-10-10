import React from 'react';

/**
 * Renderiza la lista de alertas de compra de inventario.
 */
export default function InventoryAlertsList({ alerts }) {
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
