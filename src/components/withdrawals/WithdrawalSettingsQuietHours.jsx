import React from 'react';

export default function WithdrawalSettingsQuietHours({
  quietStart,
  quietEnd,
  onChange,
  disabled,
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="settings-quiet-start" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Inicio franja silenciosa
        </label>
        <input
          id="settings-quiet-start"
          type="time"
          value={quietStart}
          onChange={(e) => onChange('quiet_start', e.target.value)}
          disabled={disabled}
          className="form-input"
          style={{ padding: '6px 8px', borderRadius: '8px', fontSize: '12px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="settings-quiet-end" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Fin franja silenciosa
        </label>
        <input
          id="settings-quiet-end"
          type="time"
          value={quietEnd}
          onChange={(e) => onChange('quiet_end', e.target.value)}
          disabled={disabled}
          className="form-input"
          style={{ padding: '6px 8px', borderRadius: '8px', fontSize: '12px' }}
        />
      </div>
    </div>
  );
}
