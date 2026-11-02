import React from 'react';
import { CalendarDays } from 'lucide-react';
import { styles } from '../common/uiStyles';
import { quantityWithUnit } from './requestUi';

/**
 * Bloque informativo de insumos comprometidos por reservas (Brief 39p).
 * No crea pedidos ni compras: solo muestra la sugerencia del motor.
 */
export default function ReservationsCommitment({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarDays size={15} color="var(--accent)" aria-hidden="true" />
          <span>Por reservas</span>
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{items.length} {items.length === 1 ? 'insumo' : 'insumos'}</span>
      </div>
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
        Insumos que las reservas dejan bajo el mínimo. Solo informativo: no crea pedidos ni compras.
      </p>

      {items.map((item, index) => (
        <div
          key={item.item_id || `${item.name}-${index}`}
          style={{ ...styles.card, display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 10px', fontSize: '12px' }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</span>
          <span style={{ color: 'var(--text-muted)', textAlign: 'right' }}>Mínimo: {quantityWithUnit(item.min, item.unit)}</span>
          <span style={{ color: 'var(--text-muted)' }}>Disponible: {quantityWithUnit(item.available, item.unit)}</span>
          <span style={{ color: 'var(--warning)', fontWeight: 600, textAlign: 'right' }}>Sugerencia: {quantityWithUnit(item.suggested, item.unit)}</span>
        </div>
      ))}
    </div>
  );
}
