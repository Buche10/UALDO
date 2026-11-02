import React from 'react';

/** Motivo obligatorio cuando se elige un lote distinto al recomendado. */
export default function LotJustificationField({ itemId, message, value, invalid, disabled, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <span style={{ fontSize: '12px', color: 'var(--warning)', fontWeight: 600 }}>{message}</span>
      <label htmlFor={`lot-justification-${itemId}`} style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        Motivo (5 a 300 caracteres)
      </label>
      <textarea
        id={`lot-justification-${itemId}`}
        rows={2}
        maxLength={300}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        style={{ width: '100%', padding: '8px 10px', borderRadius: '9px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)', fontSize: '12px', resize: 'vertical' }}
      />
      {invalid && (
        <span style={{ fontSize: '11px', color: 'var(--error)' }}>Escribe el motivo completo (5 a 300 caracteres).</span>
      )}
    </div>
  );
}
