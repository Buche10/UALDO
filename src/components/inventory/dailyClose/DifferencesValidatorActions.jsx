import React from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function DifferencesValidatorActions({
  serverUnexplainedCount,
  hasUnsavedChanges,
  validating,
  canEscalate = true,
  onOpenEscalate,
  onOpenValidate,
}) {
  const isValidateDisabled = serverUnexplainedCount > 0 || hasUnsavedChanges || validating;

  let statusText = 'Todas las diferencias tienen causa.';
  if (hasUnsavedChanges) {
    statusText = 'Guarda las explicaciones antes de validar.';
  } else if (serverUnexplainedCount > 0) {
    statusText = `Faltan ${serverUnexplainedCount} ${serverUnexplainedCount === 1 ? 'explicación' : 'explicaciones'} para validar.`;
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: '16px',
        borderRadius: '14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        border: '1px solid var(--border-glass)',
      }}
    >
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
          Acciones de validación
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {statusText}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {canEscalate && (
          <button
            type="button"
            onClick={onOpenEscalate}
            className="glass-card-interactive"
            style={{
              padding: '8px 14px',
              borderRadius: '9999px',
              border: '1px solid var(--border-warning)',
              background: 'var(--warning-soft)',
              color: 'var(--warning)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ShieldAlert size={14} />
            <span>Escalar a administración</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenValidate}
          disabled={isValidateDisabled}
          className="btn-primary"
          style={{
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: isValidateDisabled ? 'not-allowed' : 'pointer',
            opacity: isValidateDisabled ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <CheckCircle2 size={14} />
          <span>Validar</span>
        </button>
      </div>
    </div>
  );
}
