import React, { memo } from 'react';
import { formatQuantity } from '../../../services/quantityFormat';

/**
 * Campo de cantidad de una entrada o salida del porcionado. La cantidad
 * esperada viene del plan del motor; nunca se calcula aquí.
 */
function ProductionLineField({ fieldKey, label, unit, value, expected, isMain, error, onChange, disabled }) {
  const inputId = `production-${fieldKey.replace(':', '-')}`;
  const hasExpected = expected !== undefined && expected !== null;

  return (
    <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <label htmlFor={inputId} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
            {label}
          </label>
          {isMain && (
            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '9999px', background: 'var(--chip-bg)', color: 'var(--accent)', fontWeight: 600 }}>
              Principal
            </span>
          )}
        </div>
        {hasExpected && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Esperado: {formatQuantity(expected)} {unit || ''}
          </div>
        )}
        <div aria-live="polite" style={{ fontSize: '11px', color: 'var(--error)', marginTop: error ? '2px' : 0 }}>
          {error || null}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          className="glass-input"
          style={{ width: '85px', padding: '8px', borderRadius: '8px', border: `1px solid ${error ? 'var(--error)' : 'var(--border-glass)'}`, background: 'var(--bg-dark)', color: 'var(--text-main)', textAlign: 'right', fontSize: '13px' }}
        />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '24px' }}>{unit || ''}</span>
      </div>
    </div>
  );
}

export default memo(ProductionLineField);
