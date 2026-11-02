import React from 'react';
import { formatQuantity } from '../../services/quantityFormat';
import { daysSinceReceived } from './lotFormat';

/** Selector de lotes con código, saldo y antigüedad. */
export default function LotSelectField({ itemId, lots, selectedId, selectedLot, unit, disabled, onSelect }) {
  const days = daysSinceReceived(selectedLot?.received_on);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label htmlFor={`lot-picker-${itemId}`} style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        Elige el lote
      </label>
      <select
        id={`lot-picker-${itemId}`}
        value={selectedId}
        onChange={(event) => onSelect(event.target.value)}
        disabled={disabled}
        style={{ width: '100%', padding: '9px 10px', borderRadius: '9px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)', fontSize: '12px' }}
      >
        <option value="">Elige un lote</option>
        {lots.map((lot) => (
          <option key={lot.id} value={lot.id}>
            {lot.code} · {formatQuantity(lot.balances?.[0]?.quantity)} {unit} · {daysSinceReceived(lot.received_on) ?? 0} días
          </option>
        ))}
      </select>
      {selectedLot && (
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {selectedLot.code} · {days === null ? 'Sin fecha' : `${days} días`} · Saldo {formatQuantity(selectedLot.balances?.[0]?.quantity)} {unit}
        </span>
      )}
    </div>
  );
}
