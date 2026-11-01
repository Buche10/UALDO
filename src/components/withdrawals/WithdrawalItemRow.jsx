import React, { useState } from 'react';
import { Search, X, AlertCircle } from 'lucide-react';
import { useItemSearch } from '../../hooks/useItemSearch';

export default function WithdrawalItemRow({
  item,
  index,
  onChange,
  onRemove,
  canRemove,
  lineError,
  disabled,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const { results, searching } = useItemSearch(searchTerm);

  const handleSelectFromSearch = (catalogItem) => {
    onChange(item.tempId, {
      item_id: catalogItem.id,
      name: catalogItem.name,
      unit: catalogItem.unit || 'unidad',
    });
    setSearchTerm('');
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '12px',
        borderRadius: '12px',
        background: 'var(--bg-card)',
        border: lineError ? '1px solid var(--border-error)' : '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Insumo #{index + 1}
        </span>
        {canRemove && !disabled && (
          <button
            type="button"
            onClick={() => onRemove(item.tempId)}
            aria-label={`Quitar insumo ${index + 1}`}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {!item.item_id ? (
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Escribe el nombre del insumo (ej. Azúcar, Leche)..."
              disabled={disabled}
              className="glass-input"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '13px',
                background: 'var(--bg-dark)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-glass)',
              }}
            />
          </div>

          {searching && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Buscando en catálogo...
            </div>
          )}

          {results.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 50,
                marginTop: '4px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-glass)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-dialog)',
                maxHeight: '160px',
                overflowY: 'auto',
              }}
            >
              {results.slice(0, 6).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectFromSearch(r)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border-glass)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{r.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{r.unit}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{item.name}</strong>
            <button
              type="button"
              onClick={() => onChange(item.tempId, { item_id: null, name: '', unit: '' })}
              disabled={disabled}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '11px',
                marginLeft: '8px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Cambiar
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              value={item.quantity || ''}
              onChange={(e) => onChange(item.tempId, { quantity: e.target.value })}
              placeholder="0.000"
              disabled={disabled}
              className="glass-input"
              style={{
                width: '80px',
                padding: '6px 8px',
                borderRadius: '8px',
                fontSize: '13px',
                textAlign: 'right',
                background: 'var(--bg-dark)',
                color: 'var(--text-main)',
                border: lineError ? '1px solid var(--border-error)' : '1px solid var(--border-glass)',
              }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '35px' }}>
              {item.unit}
            </span>
          </div>
        </div>
      )}

      {lineError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--error)', fontSize: '11px', marginTop: '2px' }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{Array.isArray(lineError) ? lineError[0] : lineError}</span>
        </div>
      )}
    </div>
  );
}
