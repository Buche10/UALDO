import React from 'react';
import { addDays, dayLabel } from './reservationUi';
import { styles } from '../common/uiStyles';

/**
 * Selector de día: hoy, mañana u otra fecha (Brief 39p).
 */
export default function ReservationDaySelector({ date, today, onChange }) {
  const options = [
    { value: today, label: 'Hoy' },
    { value: addDays(today, 1), label: 'Mañana' },
  ];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={date === option.value}
          style={{
            padding: '6px 12px',
            borderRadius: '9999px',
            border: '1px solid var(--border-glass)',
            background: date === option.value ? 'var(--primary)' : 'var(--chip-bg)',
            color: date === option.value ? 'var(--on-primary)' : 'var(--text-main)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {option.label}
        </button>
      ))}
      <label htmlFor="reservation-day" style={{ ...styles.label, margin: 0, fontSize: '11px' }}>
        Otra fecha
      </label>
      <input
        id="reservation-day"
        type="date"
        value={date}
        onChange={(event) => onChange(event.target.value)}
        style={{ ...styles.input, width: 'auto', padding: '6px 8px', fontSize: '12px' }}
      />
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{dayLabel(date, today)}</span>
    </div>
  );
}
