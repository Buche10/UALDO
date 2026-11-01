import React from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function DifferencesValidatorActions({
  unexplainedCount,
  validating,
  onOpenEscalate,
  onOpenValidate,
}) {
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
          Acciones del jefe de área
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {unexplainedCount > 0
            ? `Faltan ${unexplainedCount} explicaciones para validar.`
            : 'Todas las diferencias tienen causa.'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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

        <button
          type="button"
          onClick={onOpenValidate}
          disabled={unexplainedCount > 0 || validating}
          className="btn-primary"
          style={{
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: unexplainedCount > 0 ? 'not-allowed' : 'pointer',
            opacity: unexplainedCount > 0 ? 0.5 : 1,
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
