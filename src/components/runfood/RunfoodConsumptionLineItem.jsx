import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Utensils } from 'lucide-react';
import { formatQuantity } from '../../services/quantityFormat';

/**
 * Fila de insumo descontado por ventas con desglose de platos de origen (Brief 25p).
 */
export default function RunfoodConsumptionLineItem({ line }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const origenes = line.origenes || [];
  const hasOrigenes = origenes.length > 0;

  return (
    <div
      style={{
        borderRadius: 10,
        border: '1px solid var(--border-glass)',
        background: 'var(--card-subtle-bg)',
        overflow: 'hidden'
      }}
    >
      <button
        type="button"
        onClick={() => hasOrigenes && setIsExpanded((prev) => !prev)}
        disabled={!hasOrigenes}
        aria-expanded={isExpanded}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          background: 'transparent',
          border: 'none',
          cursor: hasOrigenes ? 'pointer' : 'default',
          textAlign: 'left',
          gap: 8
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
            {line.nombre}
          </p>
          {hasOrigenes && (
            <p style={{ margin: '2px 0 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
              {origenes.length} {origenes.length === 1 ? 'plato de origen' : 'platos de origen'}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--accent)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            -{formatQuantity(line.cantidad)} {line.unidad || ''}
          </span>
          {hasOrigenes && (
            <span style={{ color: 'var(--text-muted)', display: 'flex' }}>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          )}
        </div>
      </button>

      {isExpanded && hasOrigenes && (
        <div
          style={{
            padding: '8px 12px 12px 12px',
            borderTop: '1px solid var(--border-glass)',
            background: 'var(--chip-bg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          {origenes.map((orig, idx) => (
            <div
              key={`${orig.articulo_runfood_id || idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11,
                color: 'var(--text-main)',
                padding: '4px 0',
                borderBottom: idx < origenes.length - 1 ? '1px solid var(--card-subtle-border)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Utensils size={12} stroke="var(--text-muted)" />
                <span>{orig.descripcion || 'Plato'}</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  ({formatQuantity(orig.cantidad_vendida)} vend.)
                </span>
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                {formatQuantity(orig.cantidad_consumida)} {line.unidad || ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
