import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useItemSearch } from '../../hooks/useItemSearch';

/**
 * Selector y buscador de insumos de Ualdo para mapeo de RunFood (Brief 24p-fix).
 */
export default function RunfoodItemPicker({
  selectedItem,
  onSelectItem,
  onClearItem,
  fieldError
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const { results, searching, failed } = useItemSearch(searchTerm);

  if (selectedItem) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            background: 'var(--chip-bg)',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Insumo de Ualdo</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
              {selectedItem.name} ({selectedItem.unit || 'unidad'})
            </span>
          </div>
          <button
            type="button"
            onClick={onClearItem}
            style={{
              padding: '4px 8px',
              borderRadius: 9999,
              border: '1px solid var(--border-glass)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: 11,
              cursor: 'pointer'
            }}
          >
            Cambiar
          </button>
        </div>
        {fieldError && (
          <span style={{ fontSize: 11, color: 'var(--error)', marginTop: 2 }}>
            {fieldError}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)' }}>
        Buscar insumo de Ualdo
      </label>
      <div style={{ position: 'relative' }}>
        <Search
          size={16}
          stroke="var(--text-muted)"
          style={{ position: 'absolute', left: 10, top: 10 }}
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Escribe al menos 2 letras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 10px 8px 34px',
            borderRadius: 10,
            border: '1px solid var(--border-glass)',
            background: 'var(--chip-bg)',
            color: 'var(--text-main)',
            fontSize: 13
          }}
        />
      </div>

      {searching && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Buscando...</span>}
      {failed && <span style={{ fontSize: 11, color: 'var(--error)' }}>Error al buscar insumos.</span>}

      {results.length > 0 && (
        <div
          style={{
            maxHeight: 160,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            border: '1px solid var(--border-glass)',
            borderRadius: 10,
            padding: 4,
            background: 'var(--bg-card)'
          }}
        >
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onSelectItem(r);
                setSearchTerm('');
              }}
              style={{
                textAlign: 'left',
                padding: '8px 10px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-main)',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <span>{r.name}</span>
              <span style={{ color: 'var(--text-muted)' }}>{r.unit}</span>
            </button>
          ))}
        </div>
      )}

      {fieldError && (
        <span style={{ fontSize: 11, color: 'var(--error)' }}>
          {fieldError}
        </span>
      )}
    </div>
  );
}
