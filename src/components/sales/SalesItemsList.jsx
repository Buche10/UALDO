import React from 'react';
import { UtensilsCrossed, RefreshCw, ChevronDown } from 'lucide-react';
import { formatUsd } from '../../services/money';
import { formatQuantity } from '../../services/quantityFormat';

/**
 * Listado paginado y ordenable de platos más vendidos (Brief 23p).
 * Permite alternar orden por cantidad o por total vendido, y paginar con "Cargar más".
 */
export default function SalesItemsList({
  items = [],
  loading,
  error,
  hasMore,
  onLoadMore,
  onRetry,
  sort = 'quantity',
  onSortChange
}) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '18px',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      {/* Cabecera y controles de orden */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UtensilsCrossed size={18} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
            Platos más vendidos
          </h3>
        </div>

        {/* Selector de orden con botones pastilla accesibles */}
        <div
          role="group"
          aria-label="Criterio de ordenación"
          style={{
            display: 'flex',
            gap: '4px',
            background: 'var(--chip-bg)',
            padding: '3px',
            borderRadius: '9999px',
            border: '1px solid var(--border-glass)'
          }}
        >
          <button
            type="button"
            onClick={() => onSortChange && onSortChange('quantity')}
            aria-pressed={sort === 'quantity'}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              border: 'none',
              background: sort === 'quantity' ? 'var(--primary)' : 'transparent',
              color: sort === 'quantity' ? 'var(--on-primary)' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Por cantidad
          </button>
          <button
            type="button"
            onClick={() => onSortChange && onSortChange('total')}
            aria-pressed={sort === 'total'}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              border: 'none',
              background: sort === 'total' ? 'var(--primary)' : 'transparent',
              color: sort === 'total' ? 'var(--on-primary)' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Por total
          </button>
        </div>
      </div>

      {/* Estado de error */}
      {error && (
        <div
          style={{
            padding: '12px',
            borderRadius: '10px',
            background: 'var(--error-soft)',
            border: '1px solid var(--border-error)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--error)' }}>{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              style={{
                alignSelf: 'flex-start',
                padding: '6px 12px',
                borderRadius: '9999px',
                border: '1px solid var(--error)',
                background: 'transparent',
                color: 'var(--error)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} />
              <span>Reintentar</span>
            </button>
          )}
        </div>
      )}

      {/* Estado de carga inicial */}
      {loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando platos más vendidos...
        </div>
      )}

      {/* Estado vacío */}
      {!loading && !error && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
          No hay artículos vendidos en este periodo.
        </div>
      )}

      {/* Lista de artículos */}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item, idx) => (
            <div
              key={item.id ?? item.articulo_id ?? idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'var(--card-subtle-bg)',
                border: '1px solid var(--border-glass)',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-subtle)', width: '22px' }}>
                  #{idx + 1}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={item.descripcion}
                  >
                    {item.descripcion}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Cant: {formatQuantity(item.cantidad)}</span>
                    {item.participacion !== undefined && (
                      <span>Part: {item.participacion}%</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>
                  {formatUsd(item.total)}
                </span>
              </div>
            </div>
          ))}

          {/* Botón Cargar más */}
          {hasMore && (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loading}
              style={{
                marginTop: '6px',
                padding: '10px 16px',
                borderRadius: '9999px',
                border: '1px solid var(--border-glass)',
                background: 'var(--chip-bg)',
                color: 'var(--text-main)',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <ChevronDown size={14} />
              <span>{loading ? 'Cargando más...' : 'Cargar más platos'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
