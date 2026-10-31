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
                borderRadius: 6
              }}
            >
              <span style={{ color: 'var(--text-main)' }}>
                {item.descripcion}
                {qty ? ` (${formatQuantity(qty)} vend.)` : ''}
              </span>
              {onAction && (
                <button
                  type="button"
                  onClick={() => onAction(item.descripcion)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
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
