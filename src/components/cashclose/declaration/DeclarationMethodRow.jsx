import React from 'react';
import { formatUsd } from '../../../services/money';

export default function DeclarationMethodRow({
  medio,
  etiqueta,
  esperado,
  value,
  diff,
  onChange,
}) {
  const isDiff = Math.abs(diff) > 0.009;

  return (
    <div
      className="glass-card"
      style={{
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      <div>
        <label
          htmlFor={`medio_${medio}`}
          style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}
        >
          {etiqueta || medio}
        </label>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Esperado: {formatUsd(esperado)}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          id={`medio_${medio}`}
          type="text"
          inputMode="decimal"
          value={value}
          placeholder="0.00"
          onChange={(e) => onChange(medio, e.target.value)}
          style={{
            width: '110px',
            padding: '8px 10px',
            borderRadius: '8px',
            border: '1px solid var(--border-glass)',
            background: 'var(--bg-input, var(--chip-bg))',
            color: 'var(--text-main)',
            fontSize: '13px',
            textAlign: 'right',
          }}
        />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: isDiff ? 'var(--warning)' : 'var(--success)',
            minWidth: '70px',
            textAlign: 'right',
          }}
        >
          Dif: {formatUsd(diff)}
        </span>
      </div>
    </div>
  );
}
