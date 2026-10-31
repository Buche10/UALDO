import React from 'react';

/**
 * Pestañas de estado con soporte opcional de contadores (Brief 24p-fix).
 */
export default function RunfoodStatusTabs({
  tabs,
  activeKey,
  onSelect,
  ariaLabel = 'Estado de filtros'
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        gap: 6,
        background: 'var(--chip-bg)',
        padding: 4,
        borderRadius: 14,
        border: '1px solid var(--border-glass)',
        overflowX: 'auto'
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeKey === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.key)}
            style={{
              flex: 1,
              minWidth: 'max-content',
              padding: '8px 10px',
              borderRadius: 10,
              border: 'none',
              background: isActive ? 'var(--primary)' : 'transparent',
              color: isActive ? 'var(--on-primary)' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  padding: '1px 6px',
                  borderRadius: 9999,
                  background: isActive ? 'var(--badge-active-bg)' : 'var(--badge-inactive-bg)',
                  fontSize: 10,
                  fontWeight: 700
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
