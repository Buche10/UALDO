import React, { memo } from 'react';
import { formatQuantity } from '../../../services/quantityFormat';

/**
 * Fila individual de insumo en la planilla de conteo.
 * Optimizado con React.memo para evitar re-renderizados innecesarios en listas grandes.
 */
function CountSheetRow({
  item,
  locationKey,
  countedValue,
  showSystemQty,
  error,
  notice = null,
  onChange,
  readOnly = false,
}) {
  const rawLocQty = item.stock_by_location?.[locationKey];
  const systemQty = formatQuantity(rawLocQty);

  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: '10px',
        background: 'var(--surface-soft)',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <label
            htmlFor={`count-input-${item.id}`}
            style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}
          >
            {item.name}
          </label>
          {item.code && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {item.code}
            </span>
          )}
        </div>

        {item.category && (
          <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
            {item.category.name}
          </div>
        )}

        {showSystemQty && (
          <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '2px' }}>
            Sistema: {systemQty} {item.unit || ''}
          </div>
        )}

        <div
          aria-live="polite"
          style={{
            fontSize: '11px',
            color: 'var(--error)',
            marginTop: '2px',
            minHeight: error ? '16px' : '0px',
          }}
        >
          {error ? (Array.isArray(error) ? error.join(', ') : error) : null}
        </div>

        {notice && (
          <div style={{ fontSize: '11px', color: 'var(--warning)', marginTop: '2px' }}>
            {notice}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input
          id={`count-input-${item.id}`}
          type="text"
          inputMode="decimal"
          placeholder={readOnly ? '-' : 'Sin contar'}
          value={countedValue}
          readOnly={readOnly}
          onChange={(e) => {
            if (!readOnly && onChange) {
              onChange(item.id, e.target.value);
            }
          }}
          className="glass-input"
          style={{
            width: '85px',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid var(--border-glass)',
            background: 'var(--bg-dark)',
            color: 'var(--text-main)',
            textAlign: 'right',
            fontSize: '13px',
            opacity: readOnly ? 0.8 : 1,
            cursor: readOnly ? 'default' : 'text',
          }}
        />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '24px' }}>
          {item.unit || ''}
        </span>
      </div>
    </div>
  );
}

export default memo(CountSheetRow);
