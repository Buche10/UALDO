import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatUsd } from '../../services/money';

/**
 * Lista de los 10 platos sin cobertura con mayores ventas (Brief 24p-fix).
 */
export default function CoverageMissingList({ items = [] }) {
  if (!items.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <AlertTriangle size={14} stroke="var(--warning)" />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
          Platos que más venden sin cobertura
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((plato, idx) => (
          <div
            key={plato.runfood_article_id ?? idx}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ color: 'var(--text-subtle)', fontWeight: 700, width: 18 }}>
                #{idx + 1}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span
                  style={{
                    color: 'var(--text-main)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {plato.descripcion}
                </span>
                <span style={{ fontSize: 10, color: 'var(--warning)' }}>
                  {plato.motivo === 'sin_receta' ? 'Sin receta' : 'Receta incompleta'}
                </span>
              </div>
            </div>

            <span style={{ fontWeight: 600, color: 'var(--text-main)', flexShrink: 0 }}>
              {formatUsd(plato.total_formateado)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
