import React from 'react';

export default function WithdrawalFormLateFields({
  isLate,
  onToggleLate,
  withdrawnAt,
  onChangeWithdrawnAt,
  lateReason,
  onChangeLateReason,
  disabled,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '10px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={isLate}
          onChange={(e) => onToggleLate(e.target.checked)}
          disabled={disabled}
          style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
        />
        <span>Lo retiré antes de avisar</span>
      </label>

      {isLate && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="withdrawal-withdrawn-at" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Fecha y hora en que se retiró (máx. 24h atrás)
            </label>
            <input
              id="withdrawal-withdrawn-at"
              type="datetime-local"
              value={withdrawnAt}
              onChange={(e) => onChangeWithdrawnAt(e.target.value)}
              disabled={disabled}
              className="form-input"
              style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="withdrawal-late-reason" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Motivo del retiro tardío (obligatorio)
            </label>
            <input
              id="withdrawal-late-reason"
              type="text"
              value={lateReason}
              onChange={(e) => onChangeLateReason(e.target.value)}
              placeholder="Ej. Salón en hora pico, emergencia de servicio..."
              maxLength={200}
              disabled={disabled}
              className="glass-input"
              style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
