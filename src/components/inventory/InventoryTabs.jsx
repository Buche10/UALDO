import React from 'react';
import InventorySearchToolbar from './InventorySearchToolbar';

const TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'low_stock', label: 'Stock Bajo' },
  { id: 'alerts', label: 'Alertas' },
];

export default function InventoryTabs({
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  includeInactive,
  onIncludeInactiveChange,
}) {
  return (
    <>
      <div style={{ display: 'flex', gap: '6px', background: 'var(--chip-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--on-primary)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== 'alerts' && (
        <InventorySearchToolbar
          search={search}
          setSearch={onSearchChange}
          includeInactive={includeInactive}
          setIncludeInactive={onIncludeInactiveChange}
        />
      )}
    </>
  );
}
