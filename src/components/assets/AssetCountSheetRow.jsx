import React from 'react';

export default function AssetCountSheetRow({ line, countedValue, value, onChange, disabled }) {
  const handleChange = (e) => {
    const val = e.target.value;
    onChange?.(val, line.asset_id);
  };

  const displayVal = countedValue !== undefined ? countedValue : (value ?? '');

  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: '8px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {line.asset_name || `Activo #${line.asset_id}`}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          ID: {line.asset_id}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label htmlFor={`asset-count-input-${line.asset_id}`} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Contado:
        </label>
        <input
          id={`asset-count-input-${line.asset_id}`}
          type="number"
          min="0"
          value={displayVal}
          onChange={handleChange}
          disabled={disabled}
          placeholder="0"
          style={{
            width: '70px',
            padding: '6px 8px',
            borderRadius: '6px',
            background: 'var(--bg-input, var(--bg-dark))',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-main)',
            fontSize: '13px',
            textAlign: 'center',
          }}
        />
      </div>
    </div>
  );
}
