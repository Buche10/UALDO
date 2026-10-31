import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * Campo de búsqueda reutilizable con icono de lupa y botón para limpiar (Brief 24p-fix).
 */
export default function RunfoodSearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Buscar...',
  ariaLabel = 'Buscar'
}) {
  return (
    <div style={{ position: 'relative' }}>
      <Search
        size={16}
        stroke="var(--text-muted)"
        style={{ position: 'absolute', left: 10, top: 10 }}
        aria-hidden="true"
      />
      <input
        type="text"
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 34px 8px 34px',
          borderRadius: 10,
          border: '1px solid var(--border-glass)',
          background: 'var(--chip-bg)',
          color: 'var(--text-main)',
          fontSize: 13
        }}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Limpiar búsqueda"
          style={{
            position: 'absolute',
            right: 8,
            top: 7,
            padding: 4,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
