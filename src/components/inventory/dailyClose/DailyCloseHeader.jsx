import React from 'react';

export default function DailyCloseHeader({
  selectedDate,
  today,
  yesterday,
  onDateChange,
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
      <div>
        <h2 className="section-title" style={{ margin: 0 }}>Cierre del día</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
          Conteo físico por área y conciliación con el sistema.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '6px', background: 'var(--chip-bg)', padding: '4px', borderRadius: '9999px', border: '1px solid var(--border-glass)' }}>
        <button
          type="button"
          onClick={() => onDateChange(today)}
          style={{
            padding: '6px 14px',
            borderRadius: '9999px',
            border: 'none',
            background: selectedDate === today ? 'var(--primary)' : 'transparent',
            color: selectedDate === today ? 'var(--on-primary)' : 'var(--text-muted)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Hoy
        </button>
        <button
          type="button"
          onClick={() => onDateChange(yesterday)}
          style={{
            padding: '6px 14px',
            borderRadius: '9999px',
            border: 'none',
            background: selectedDate === yesterday ? 'var(--primary)' : 'transparent',
            color: selectedDate === yesterday ? 'var(--on-primary)' : 'var(--text-muted)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Ayer
        </button>
      </div>
    </div>
  );
}
