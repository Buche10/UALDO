import React from 'react';
import { Edit2, RefreshCw, AlertTriangle } from 'lucide-react';
import { ASSET_CATEGORY_LABELS, ASSET_STATUS_LABELS } from '../../services/assetsClient';

export default function AssetCatalogTable({ assets = [], canManage, onEdit, onChangeStatus }) {
  if (assets.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        No hay activos registrados en esta categoría.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {assets.map((asset) => {
        const isBelowMin = asset.below_minimum || (asset.min_quantity !== null && asset.expected_quantity < asset.min_quantity);
        const statusColor = asset.status === 'activo'
          ? 'var(--success)'
          : asset.status === 'fuera_de_servicio'
          ? 'var(--warning)'
          : 'var(--text-muted)';

        return (
          <div
            key={asset.id}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'var(--bg-card)',
              border: isBelowMin ? '1px solid var(--border-warning)' : '1px solid var(--border-glass)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {asset.name}
                  </span>
                  {asset.code && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--chip-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                      {asset.code}
                    </span>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--accent)', background: 'var(--surface-soft)', padding: '2px 6px', borderRadius: '4px' }}>
                    {ASSET_CATEGORY_LABELS[asset.category] || asset.category}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'var(--chip-bg)',
                    color: statusColor,
                    border: `1px solid ${statusColor}`,
                  }}
                >
                  {ASSET_STATUS_LABELS[asset.status] || asset.status}
                </span>

                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => onEdit(asset)}
                      aria-label={`Editar ${asset.name}`}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '6px',
                        padding: '4px 6px',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeStatus(asset)}
                      aria-label={`Cambiar estado de ${asset.name}`}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '6px',
                        padding: '4px 6px',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <RefreshCw size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
              <div>
                Esperado: <strong style={{ color: 'var(--text-main)' }}>{asset.expected_quantity}</strong>
              </div>
              <div>
                Mínimo: <strong style={{ color: 'var(--text-main)' }}>{asset.min_quantity !== null && asset.min_quantity !== undefined ? asset.min_quantity : '-'}</strong>
              </div>
              {Number(asset.open_incidents) > 0 && (
                <div style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <AlertTriangle size={12} /> {asset.open_incidents} avería(s)
                </div>
              )}
              {Number(asset.broken_last_30_days) > 0 && (
                <div style={{ color: 'var(--error)' }}>
                  {asset.broken_last_30_days} rotas (30d)
                </div>
              )}
              {isBelowMin && (
                <div style={{ color: 'var(--warning)', fontWeight: 600 }}>
                  Bajo mínimo
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
