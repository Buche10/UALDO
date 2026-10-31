import React from 'react';

/**
 * Campo para ingresar el factor de conversión con texto de ayuda contextual y error (Brief 24p-fix).
 */
export default function RunfoodFactorInput({
  factor,
  onChange,
  fieldError,
  itemName,
  itemUnit,
  articleName
}) {
  const helperText = itemName
    ? `Cuántas unidades de ${itemName} (${itemUnit}) equivalen a 1 unidad de RunFood de ${articleName}.`
    : 'Cuántas unidades del insumo equivalen a 1 unidad de RunFood.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)' }}>
        Factor de conversión
      </label>
      <input
        type="text"
        inputMode="decimal"
        placeholder="1.000000"
        value={factor}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: 10,
          border: `1px solid ${fieldError ? 'var(--border-error)' : 'var(--border-glass)'}`,
          background: 'var(--chip-bg)',
          color: 'var(--text-main)',
          fontSize: 14,
          fontWeight: 600
        }}
      />
      {fieldError && (
        <span style={{ fontSize: 11, color: 'var(--error)' }}>
          {fieldError}
        </span>
      )}
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {helperText}
      </span>
    </div>
  );
}
