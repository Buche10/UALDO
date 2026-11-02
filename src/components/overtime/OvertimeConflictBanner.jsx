import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function OvertimeConflictBanner({
  conflictData,
  onVoidAndRetry,
  onDismiss,
  submitting = false,
}) {
  if (!conflictData) return null;

  const hours = conflictData.hours ?? '';
  const registeredBy = conflictData.registered_by?.name || 'otro usuario';

  return (
    <div
      role="alert"
      style={{
        padding: '12px 14px',
        borderRadius: '8px',
        background: 'var(--warning-soft)',
        border: '1px solid var(--border-warning)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        fontSize: '13px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ color: 'var(--text-main)', lineHeight: '1.4' }}>
          Ya existe un registro de horas extra para este trabajador en esta fecha ({hours} h registradas por {registeredBy}).
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onDismiss}
          disabled={submitting}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'var(--chip-bg)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-muted)',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontSize: '12px',
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => onVoidAndRetry(conflictData)}
          disabled={submitting}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            background: 'var(--primary)',
            border: '1px solid var(--border-glow)',
            color: 'var(--on-primary)',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '12px',
          }}
        >
          {submitting ? 'Procesando...' : 'Anular y registrar de nuevo'}
        </button>
      </div>
    </div>
  );
}
