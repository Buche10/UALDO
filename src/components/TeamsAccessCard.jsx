import React from 'react';
import { ChevronRight, ListChecks } from 'lucide-react';

export default function TeamsAccessCard({ onOpen }) {
  return (
    <button
      type="button"
      className="glass-card"
      onClick={onOpen}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '14px',
        borderRadius: '16px',
        border: '1px solid var(--border-glass)',
        background: 'var(--bg-card)',
        color: 'var(--text-main)',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--grad-primary)',
          color: 'var(--on-primary)',
          flexShrink: 0,
        }}
      >
        <ListChecks size={20} aria-hidden="true" />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '14px', fontWeight: 600 }}>Ualdo Teams</span>
        <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Tareas, avances y avisos del equipo.
        </span>
      </span>
      <ChevronRight size={18} color="var(--text-muted)" aria-hidden="true" />
    </button>
  );
}
