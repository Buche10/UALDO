import React from 'react';

export default function WithdrawalSettingsIntervals({
  afterMinutes,
  intervalMinutes,
  onChange,
  disabled,
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="settings-after" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Primer recordatorio (minutos)
        </label>
        <input
          id="settings-after"
          type="number"
          min="15"
          max="1440"
          value={afterMinutes}
          onChange={(e) => onChange('reminder_after_minutes', e.target.value)}
          disabled={disabled}
          className="form-input"
          style={{ padding: '6px 8px', borderRadius: '8px', fontSize: '12px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="settings-interval" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Intervalo entre avisos (minutos)
        </label>
        <input
          id="settings-interval"
          type="number"
          min="15"
          max="1440"
          value={intervalMinutes}
          onChange={(e) => onChange('reminder_interval_minutes', e.target.value)}
          disabled={disabled}
          className="form-input"
          style={{ padding: '6px 8px', borderRadius: '8px', fontSize: '12px' }}
        />
      </div>
    </div>
  );
}
