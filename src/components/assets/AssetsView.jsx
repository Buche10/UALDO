import React, { useState } from 'react';
import { UtensilsCrossed, ArrowLeft } from 'lucide-react';
import { can, ABILITIES } from '../../services/permissions';
import AssetCatalogTab from './AssetCatalogTab';
import AssetCountTab from './AssetCountTab';
import AssetReportTab from './AssetReportTab';

export default function AssetsView({ user, initialTab = 'catalog', onBack, onNavigateToIncident }) {
  const normalizeTab = (tab) => {
    if (tab === 'conteo' || tab === 'count') return 'count';
    if (tab === 'reporte' || tab === 'report') return 'report';
    return 'catalog';
  };

  const [activeTab, setActiveTab] = useState(() => normalizeTab(initialTab));
  const canManage = can(user, ABILITIES.SETTINGS_MANAGE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <UtensilsCrossed size={20} color="var(--accent)" aria-hidden="true" />
            <span>Vajilla y equipos</span>
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Inventario mensual de vajilla, cristalería y equipos por área.
          </p>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ArrowLeft size={16} /> Volver
          </button>
        )}
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', gap: '4px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          style={{
            padding: '8px 14px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'catalog' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'catalog' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'catalog' ? 600 : 400,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Catálogo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('count')}
          style={{
            padding: '8px 14px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'count' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'count' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'count' ? 600 : 400,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Conteo del mes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('report')}
          style={{
            padding: '8px 14px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'report' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'report' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'report' ? 600 : 400,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Reporte
        </button>
      </div>

      {activeTab === 'catalog' && (
        <AssetCatalogTab user={user} canManage={canManage} />
      )}

      {activeTab === 'count' && (
        <AssetCountTab user={user} />
      )}

      {activeTab === 'report' && (
        <AssetReportTab user={user} onNavigateToIncident={onNavigateToIncident} />
      )}
    </div>
  );
}
