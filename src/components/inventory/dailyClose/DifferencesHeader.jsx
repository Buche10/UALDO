import React from 'react';
import { ArrowLeft, Save, Edit3 } from 'lucide-react';

export default function DifferencesHeader({
  onBack,
  canValidate,
  countStatus,
  onOpenEditSheet,
  onSaveExplanations,
  saving,
  hasLines,
}) {
  const isValidated = countStatus === 'validated';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '13px',
        }}
      >
        <ArrowLeft size={16} />
        <span>Volver al cierre</span>
      </button>

      {!isValidated && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canValidate && countStatus === 'submitted' && onOpenEditSheet && (
            <button
              type="button"
              onClick={onOpenEditSheet}
              className="glass-card-interactive"
              style={{
                padding: '6px 12px',
                borderRadius: '9999px',
                border: '1px solid var(--border-glass)',
                background: 'var(--surface-strong)',
                color: 'var(--text-main)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Edit3 size={14} />
              <span>Corregir conteo</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSaveExplanations}
            disabled={saving || !hasLines}
            className="btn-primary"
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: saving || !hasLines ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Save size={14} />
            <span>{saving ? 'Guardando...' : 'Guardar explicaciones'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
