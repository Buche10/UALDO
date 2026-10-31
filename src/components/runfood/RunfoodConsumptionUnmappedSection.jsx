import React from 'react';
import { formatQuantity } from '../../services/quantityFormat';

/**
 * Seccion de lista de articulos no descontados (Brief 25p).
 */
export default function RunfoodConsumptionUnmappedSection({
  title,
  items,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  qtyField = 'cantidad'
}) {
  if (!items || items.length === 0) return null;

  return (
    <div>
      <p style={{ margin: '0 0 6px 0', fontSize: 11, fontWeight: 600, color: 'var(--warning)' }}>
        {title} ({items.length}):
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, idx) => {
          const qty = item[qtyField];
          const query = (Array.isArray(item.faltantes) && item.faltantes.length > 0 && item.faltantes[0])
            ? item.faltantes[0]
            : item.descripcion;

          return (
            <div
              key={`${item.articulo_runfood_id || idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
                padding: '4px 8px',
                background: 'var(--chip-bg)',
                borderRadius: 6,
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ color: 'var(--text-main)' }}>
                  {item.descripcion}
                  {qty ? ` (${formatQuantity(qty)} vend.)` : ''}
                </span>
                {Array.isArray(item.faltantes) && item.faltantes.length > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Faltantes: {item.faltantes.join(', ')}
                  </span>
                )}
              </div>
              {onAction && (
                <button
                  type="button"
                  onClick={() => onAction(query)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  {ActionIcon && <ActionIcon size={12} />}
                  <span>{actionLabel}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
