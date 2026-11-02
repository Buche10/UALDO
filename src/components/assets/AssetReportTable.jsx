import React from 'react';
import { ASSET_CATEGORY_LABELS } from '../../services/assetsClient';

export default function AssetReportTable({ rows = [] }) {
  if (rows.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        No hay registros de activos para este periodo.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {rows.map((row) => (
        <div
          key={row.asset_id}
          style={{
            padding: '12px',
            borderRadius: '8px',
            background: 'var(--bg-card)',
            border: row.bajo_minimo ? '1px solid var(--border-warning)' : '1px solid var(--border-glass)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                {row.name}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--accent)', background: 'var(--surface-soft)', padding: '1px 6px', borderRadius: '4px' }}>
                {ASSET_CATEGORY_LABELS[row.category] || row.category}
              </span>
            </div>

            {row.bajo_minimo && (
              <span style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: 600 }}>
                Bajo mínimo
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <div>
              Inicio: <strong style={{ color: 'var(--text-main)' }}>{row.esperado_inicio}</strong>
            </div>
            <div>
              Roturas: <strong style={{ color: row.roturas_validadas > 0 ? 'var(--error)' : 'var(--text-main)' }}>{row.roturas_validadas}</strong>
            </div>
            <div>
              Contado: <strong style={{ color: 'var(--text-main)' }}>{row.contado !== null && row.contado !== undefined ? row.contado : '-'}</strong>
            </div>
            <div>
              Diferencia: <strong style={{ color: row.diferencia !== 0 ? 'var(--warning)' : 'var(--success)' }}>{row.diferencia !== null && row.diferencia !== undefined ? (row.diferencia > 0 ? `+${row.diferencia}` : row.diferencia) : '-'}</strong>
            </div>
            <div>
              Final: <strong style={{ color: 'var(--text-main)' }}>{row.esperado_final}</strong>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
