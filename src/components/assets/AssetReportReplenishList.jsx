import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ASSET_CATEGORY_LABELS } from '../../services/assetsClient';

export default function AssetReportReplenishList({ items = [] }) {
  if (items.length === 0) {
    return (
      <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
        No hay activos bajo el mínimo para este periodo.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item) => {
        const currentQty = item.esperado_final !== undefined ? item.esperado_final : item.contado;
        const minQty = item.min_quantity ?? 0;
        const toReplenish = Math.max(0, minQty - currentQty);

        return (
          <div
            key={item.asset_id}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-warning)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {item.name}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--accent)', background: 'var(--surface-soft)', padding: '1px 6px', borderRadius: '4px' }}>
                  {ASSET_CATEGORY_LABELS[item.category] || item.category}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Quedan: <strong style={{ color: 'var(--error)' }}>{currentQty}</strong> • Mínimo: <strong>{minQty}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--warning)', background: 'var(--chip-bg)', padding: '4px 8px', borderRadius: '6px' }}>
              <AlertTriangle size={14} /> Faltan {toReplenish}
            </div>
          </div>
        );
      })}
    </div>
  );
}
