import React from 'react';
import { dayNumber, weekdayShort } from './reservationUi';

/**
 * Semana compacta: reservas y personas por día (Brief 39p).
 */
export default function ReservationWeekStrip({ dates = [], selected, today, counts = {}, onSelect }) {
  return (
    <div role="list" aria-label="Reservas de la semana" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '4px' }}>
      {dates.map((date) => {
        const active = date === selected;
        const isToday = date === today;
        const data = counts[date] || { count: 0, people: 0 };
        return (
          <button
            key={date}
            type="button"
            role="listitem"
            onClick={() => onSelect(date)}
            aria-label={`${weekdayShort(date)} ${dayNumber(date)}: ${data.count} reservas, ${data.people} personas`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              padding: '6px 2px',
              borderRadius: '10px',
              border: `1px solid ${active ? 'var(--accent)' : 'var(--border-glass)'}`,
              background: active ? 'var(--primary-soft)' : 'var(--chip-bg)',
              color: 'var(--text-main)',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '10px', color: isToday ? 'var(--accent)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
              {weekdayShort(date)}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>{dayNumber(date)}</span>
            <span style={{ fontSize: '10px', color: data.count ? 'var(--accent)' : 'var(--text-subtle)', fontWeight: 600 }}>
              {data.count}
            </span>
            <span style={{ fontSize: '9px', color: 'var(--text-subtle)' }}>{data.people} pers.</span>
          </button>
        );
      })}
    </div>
  );
}
