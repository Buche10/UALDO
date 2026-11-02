import React from 'react';
import { MapPin } from 'lucide-react';
import { formatQuantity } from '../../services/quantityFormat';
import { locationLabel } from '../../services/inventoryLocations';

/** Saldos del lote por producto y ubicación (crudo y porciones). */
export default function LotBalances({ balances = [], emptyText = 'Sin saldo disponible.' }) {
  const rows = (balances || []).filter((row) => Number(row.quantity) > 0);
  if (rows.length === 0) {
    return <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{emptyText}</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {rows.map((row) => (
        <div key={`${row.item_id}-${row.location}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)', minWidth: 0 }}>
            <MapPin size={12} color="var(--text-muted)" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.item || 'Insumo'} · {row.location_label || locationLabel(row.location)}
            </span>
          </span>
          <strong style={{ color: 'var(--accent)', whiteSpace: 'nowrap' }}>{formatQuantity(row.quantity)}</strong>
        </div>
      ))}
    </div>
  );
}
