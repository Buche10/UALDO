import React from 'react';
import { useShoppingList } from '../../hooks/useSupplyRequests';
import { styles } from '../common/uiStyles';
import { quantityWithUnit } from './requestUi';

/**
 * Lista de compras consolidada (Brief 22p, solo el dueño): lo aprobado y sin
 * comprar, agrupado por insumo y con los urgentes primero, como lo manda el
 * motor.
 */
export default function ShoppingListPanel() {
  const { items, loading, error, reload } = useShoppingList();

  if (loading) return <div style={styles.muted}>Cargando la lista de compras...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div aria-live="polite">
        {error && (
          <div style={{ ...styles.errorBox, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span>{error}</span>
            <button type="button" onClick={reload} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '9999px' }}>Reintentar</button>
          </div>
        )}
      </div>

      {!error && items.length === 0 && <div style={styles.muted}>No hay pedidos aprobados por comprar.</div>}

      {items.map((item) => (
        <div key={`${item.inventory_item_id ?? 'libre'}-${item.name}-${item.unit}`} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '12px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              {item.name}{item.has_urgent ? ' (urgente)' : ''}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              {item.inventory_item_id
                ? `Stock ${quantityWithUnit(item.stock, item.unit)}, mínimo ${quantityWithUnit(item.min_stock, item.unit)}.`
                : 'Fuera del catálogo.'}
              {` ${item.requests_count === 1 ? '1 pedido' : `${item.requests_count} pedidos`}.`}
            </div>
          </div>
          <div style={{ fontWeight: 700, color: item.has_urgent ? 'var(--warning)' : 'var(--text-main)', whiteSpace: 'nowrap' }}>{quantityWithUnit(item.quantity, item.unit)}</div>
        </div>
      ))}
    </div>
  );
}
