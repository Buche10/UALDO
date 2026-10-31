import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { styles } from '../common/uiStyles';
import { quantityWithUnit } from './requestUi';

/**
 * Bloque informativo de insumos bajo minimo que nadie ha pedido (Brief 26p).
 */
export default function LowStockSuggestions({ items = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={15} color="var(--warning)" />
          <span>Bajo mínimo sin pedir</span>
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {items.length} {items.length === 1 ? 'insumo' : 'insumos'}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
        Insumos con existencias por debajo del umbral mínimo que no están en pedidos pendientes.
      </p>

      {items.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
          Ningún insumo bajo mínimo.
        </div>
      ) : (
        items.map((item, idx) => (
          <div
            key={item.inventory_item_id || `${item.name}-${idx}`}
            style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', fontSize: '12px' }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {item.name}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                Stock actual: {quantityWithUnit(item.stock, item.unit)}
              </div>
            </div>
            <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: 600 }}>
                Mínimo: {quantityWithUnit(item.min_stock, item.unit)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
