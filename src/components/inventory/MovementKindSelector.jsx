import React from 'react';

export const MOVEMENT_KINDS = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'conteo', label: 'Conteo' },
  { value: 'merma', label: 'Merma' },
];

/** Botones de tipo de movimiento. */
export default function MovementKindSelector({ kind, fieldErrors, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
        Tipo de movimiento
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        {MOVEMENT_KINDS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            style={{
              padding: '8px 4px',
              borderRadius: '8px',
              border: kind === item.value ? '1px solid var(--primary-2)' : '1px solid var(--border-glass)',
              background: kind === item.value ? 'var(--primary)' : 'var(--chip-bg)',
              color: kind === item.value ? 'var(--on-primary)' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {fieldErrors.kind && (
        <span style={{ fontSize: '11px', color: 'var(--error)', marginTop: '4px', display: 'block' }}>
          {Array.isArray(fieldErrors.kind) ? fieldErrors.kind.join(', ') : fieldErrors.kind}
        </span>
      )}
    </div>
  );
}
