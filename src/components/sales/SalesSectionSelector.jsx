import React from 'react';
import { TrendingUp, Users } from 'lucide-react';

const SECTIONS = [
  { id: 'ventas', label: 'Ventas', icon: TrendingUp },
  { id: 'personal', label: 'Personal', icon: Users }
];

/**
 * Selector de secciones de ventas: General y Personal (Brief 27p).
 */
export default function SalesSectionSelector({ activeSection, onSelectSection }) {
  return (
    <div
      role="tablist"
      aria-label="Secciones de ventas"
      style={{
        display: 'flex',
        gap: '6px',
        background: 'var(--chip-bg)',
        padding: '4px',
        borderRadius: '14px',
        border: '1px solid var(--border-glass)',
        overflowX: 'auto'
      }}
    >
      {SECTIONS.map((sec) => {
        const Icon = sec.icon;
        const active = activeSection === sec.id;
        return (
          <button
            key={sec.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelectSection(sec.id)}
            style={{
              flex: 1,
              minWidth: 'max-content',
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              background: active ? 'var(--primary)' : 'transparent',
              color: active ? 'var(--on-primary)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Icon size={14} />
            <span>{sec.label}</span>
          </button>
        );
      })}
    </div>
  );
}
