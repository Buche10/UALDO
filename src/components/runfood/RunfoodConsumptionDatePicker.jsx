import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Selector de fecha con flechas anterior y siguiente (Brief 25p).
 */
export default function RunfoodConsumptionDatePicker({
  date,
  loading,
  onDateChange,
  onPreviousDay,
  onNextDay
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <button
        type="button"
        onClick={onPreviousDay}
        aria-label="Día anterior"
        disabled={loading}
        style={{
          padding: 8,
          borderRadius: 8,
          border: '1px solid var(--border-glass)',
          background: 'var(--chip-bg)',
          color: 'var(--text-main)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <ChevronLeft size={16} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
        <Calendar size={16} stroke="var(--accent)" />
        <input
          type="date"
          aria-label="Fecha de consumo"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          disabled={loading}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid var(--border-glass)',
            background: 'var(--chip-bg)',
            color: 'var(--text-main)',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'var(--font-mono)'
          }}
        />
      </div>

      <button
        type="button"
        onClick={onNextDay}
        aria-label="Día siguiente"
        disabled={loading}
        style={{
          padding: 8,
          borderRadius: 8,
          border: '1px solid var(--border-glass)',
          background: 'var(--chip-bg)',
          color: 'var(--text-main)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
