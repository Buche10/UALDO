import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function AssetReportRepairsList({ repairs = [], onNavigateToIncident }) {
  if (repairs.length === 0) {
    return (
      <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
        No hay reparaciones pendientes para este periodo.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {repairs.map((repair) => (
        <div
          key={repair.incident_id}
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                {repair.asset_name || `Activo #${repair.asset_id}`}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--warning)', background: 'var(--surface-soft)', padding: '1px 6px', borderRadius: '4px' }}>
                {repair.status || 'abierta'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {repair.title} {repair.assigned_to ? `• Resp: ${repair.assigned_to}` : ''}
            </div>
          </div>

          {onNavigateToIncident && (
            <button
              type="button"
              onClick={() => onNavigateToIncident(repair.incident_id)}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-glass)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Ver <ArrowRight size={13} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
