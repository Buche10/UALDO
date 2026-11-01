import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';

export default function WithdrawalsViewHeader({
  loading,
  canDeclare,
  canSupervise,
  activeTab,
  myCount,
  areaCount,
  onRefresh,
  onDeclare,
  onTabChange,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
          Retiros de bodega
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            style={{
              background: 'none',
              border: '1px solid var(--border-glass)',
              borderRadius: '9999px',
              padding: '6px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
            }}
            aria-label="Actualizar retiros"
          >
            <RefreshCw size={16} />
          </button>
          {canDeclare && (
            <button
              type="button"
              onClick={onDeclare}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'var(--primary)',
                color: 'var(--text-on-primary)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={16} />
              <span>Declarar retiro</span>
            </button>
          )}
        </div>
      </div>

      {canSupervise && (
        <div style={{ display: 'flex', gap: '6px', background: 'var(--surface-soft)', padding: '4px', borderRadius: '9999px' }}>
          <button
            type="button"
            onClick={() => onTabChange('my')}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: '9999px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              background: activeTab === 'my' ? 'var(--primary-soft)' : 'transparent',
              color: activeTab === 'my' ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Mis retiros ({myCount})
          </button>
          <button
            type="button"
            onClick={() => onTabChange('area')}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: '9999px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              background: activeTab === 'area' ? 'var(--primary-soft)' : 'transparent',
              color: activeTab === 'area' ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Mi área ({areaCount})
          </button>
        </div>
      )}
    </div>
  );
}
