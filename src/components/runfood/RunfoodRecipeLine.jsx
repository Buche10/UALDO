import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Línea de ingrediente dentro de una receta de RunFood (Brief 24p-fix).
 */
export default function RunfoodRecipeLine({ line, onResolveMapping }) {
  const isMapped = Boolean(line.mapeo?.insumo);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 10px',
        borderRadius: 8,
        background: 'var(--card-subtle-bg)',
        fontSize: 12,
        gap: 8
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
          {line.descripcion_runfood}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Cantidad receta: {line.cantidad}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {isMapped ? (
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              {line.mapeo.insumo.name}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              x{line.mapeo.factor} {line.mapeo.insumo.unit}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>
              Sin asociar
            </span>
            {onResolveMapping && (
              <button
                type="button"
                onClick={() => onResolveMapping(line.descripcion_runfood)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 9999,
                  border: '1px solid var(--border-warning)',
                  background: 'var(--warning-soft)',
                  color: 'var(--warning)',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer'
                }}
              >
                <span>Asociar</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
