import React from 'react';

/**
 * Tarjeta individual de acceso a un módulo de negocio.
 */
export default function ModuleCard({ module, onClick }) {
  const Icon = module.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-card-interactive"
      aria-label={`${module.label}: ${module.description}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '16px',
        borderRadius: '16px',
        border: '1px solid var(--border-glass)',
        background: 'var(--surface-strong)',
        color: 'var(--text-main)',
        textAlign: 'left',
        cursor: 'pointer',
        gap: '10px',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
    >
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          background: 'var(--primary-soft)',
          border: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent)',
          flexShrink: 0,
        }}
      >
        <Icon size={20} aria-hidden="true" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
          {module.label}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            lineHeight: 1.35,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {module.description}
        </div>
      </div>
    </button>
  );
}
