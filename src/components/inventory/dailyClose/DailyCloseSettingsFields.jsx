import React from 'react';

const AVAILABLE_LOCATIONS = [
  { value: 'kitchen', label: 'Cocina' },
  { value: 'lounge', label: 'Salón' },
];

export default function DailyCloseSettingsFields({
  reminderTime,
  setReminderTime,
  escalationTime,
  setEscalationTime,
  selectedLocations,
  onLocationToggle,
}) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label htmlFor="reminder-time-input" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
            Hora recordatorio
          </label>
          <input
            id="reminder-time-input"
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="form-input"
            style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label htmlFor="escalation-time-input" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
            Hora límite escalamiento
          </label>
          <input
            id="escalation-time-input"
            type="time"
            value={escalationTime}
            onChange={(e) => setEscalationTime(e.target.value)}
            className="form-input"
            style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
          Áreas incluidas en el cierre
        </span>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {AVAILABLE_LOCATIONS.map((loc) => {
            const checked = selectedLocations.includes(loc.value);
            return (
              <label
                key={loc.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onLocationToggle(loc.value)}
                  style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                />
                <span>{loc.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </>
  );
}
