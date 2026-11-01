import React from 'react';

/**
 * Fila individual para confirmar uso y devolución de un insumo retirado.
 * Muestra en vivo el cálculo de lo que "Queda en {área}".
 */
export default function WithdrawalCloseRow({
  line,
  consumed,
  returned,
  areaLabel,
  onChangeConsumed,
  onChangeReturned,
  disabled,
}) {
  const origQty = parseFloat(line.quantity) || 0;
  const consumedNum = parseFloat(consumed) || 0;
  const returnedNum = parseFloat(returned) || 0;
  const sum = consumedNum + returnedNum;
  const isOver = sum > origQty + 0.0001;
  const kept = Math.max(0, Math.round((origQty - sum) * 1000) / 1000);
  const itemName = line.item_name || line.item?.name || 'Insumo';
  const unit = line.unit || line.item?.unit || '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        borderRadius: '12px',
        background: 'var(--surface-soft)',
        border: isOver ? '1px solid var(--border-error)' : '1px solid var(--border-glass)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
          {itemName}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            background: 'var(--chip-bg)',
            padding: '2px 8px',
            borderRadius: '9999px',
          }}
        >
          Retirado: {line.quantity} {unit}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label
            htmlFor={`close-consumed-${line.id || line.line_id}`}
            style={{ fontSize: '11px', color: 'var(--text-muted)' }}
          >
            Usé ({unit})
          </label>
          <input
            id={`close-consumed-${line.id || line.line_id}`}
            type="number"
            step="any"
            min="0"
            max={line.quantity}
            value={consumed}
            onChange={(e) => onChangeConsumed(e.target.value)}
            disabled={disabled}
            placeholder="0"
            className="form-input"
            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label
            htmlFor={`close-returned-${line.id || line.line_id}`}
            style={{ fontSize: '11px', color: 'var(--text-muted)' }}
          >
            Devolví ({unit})
          </label>
          <input
            id={`close-returned-${line.id || line.line_id}`}
            type="number"
            step="any"
            min="0"
            max={line.quantity}
            value={returned}
            onChange={(e) => onChangeReturned(e.target.value)}
            disabled={disabled}
            placeholder="0"
            className="form-input"
            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '13px' }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          marginTop: '2px',
        }}
      >
        <span style={{ color: isOver ? 'var(--error)' : 'var(--accent)' }}>
          {isOver
            ? 'La suma de usado y devuelto supera lo retirado.'
            : `Queda en ${areaLabel}: ${kept} ${unit}`}
        </span>
      </div>
    </div>
  );
}
