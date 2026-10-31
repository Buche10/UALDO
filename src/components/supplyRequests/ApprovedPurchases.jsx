import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { styles } from '../common/uiStyles';
import { quantityWithUnit } from './requestUi';

/**
 * Bloque de pedidos aprobados pendientes de compra (Brief 26p).
 */
export default function ApprovedPurchases({ items = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShoppingCart size={15} color="var(--accent)" />
          <span>Compras aprobadas</span>
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {items.length} {items.length === 1 ? 'insumo' : 'insumos'}
        </span>
      </div>

      {items.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
          No hay pedidos aprobados por comprar.
        </div>
      ) : (
        items.map((item) => {
          const key = `${item.inventory_item_id ?? 'libre'}-${item.name}-${item.unit}`;
          const withoutQty = Number(item.requests_without_quantity || 0);
          return (
            <div key={key} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '12px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {item.name}{item.has_urgent ? ' (urgente)' : ''}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  {item.inventory_item_id
                    ? `Stock ${quantityWithUnit(item.stock, item.unit)}, mínimo ${quantityWithUnit(item.min_stock, item.unit)}.`
                    : 'Fuera del catálogo.'}
                  {` ${item.requests_count === 1 ? '1 pedido' : `${item.requests_count} pedidos`}.`}
                  {withoutQty > 0 && (
                    <span style={{ color: 'var(--warning)', fontWeight: 500 }}>
                      {` ${withoutQty} ${withoutQty === 1 ? 'pedido sin cantidad' : 'pedidos sin cantidad'}.`}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ fontWeight: 700, color: item.has_urgent ? 'var(--warning)' : 'var(--text-main)', whiteSpace: 'nowrap' }}>
                {quantityWithUnit(item.quantity, item.unit)}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
