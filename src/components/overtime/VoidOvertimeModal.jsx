import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export default function VoidOvertimeModal({ entry, onConfirm, onCancel, submitting = false }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  if (!entry) return null;

  const workerName = entry.worker?.name || entry.worker_name || 'Trabajador';
  const hours = entry.hours ?? 0;
  const date = entry.work_date || '';

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setError('El motivo debe tener al menos 5 caracteres.');
      return;
    }
    if (trimmed.length > 300) {
      setError('El motivo no puede superar los 300 caracteres.');
      return;
    }
    setError(null);
    onConfirm(trimmed);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="void-overtime-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--grad-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-glass)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: 'var(--shadow-dialog)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} color="var(--warning)" />
          <h3 id="void-overtime-title" style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)', fontWeight: 600 }}>
            Anular registro de horas extra
          </h3>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          Vas a anular el registro de <strong style={{ color: 'var(--text-main)' }}>{workerName}</strong> del día <strong style={{ color: 'var(--text-main)' }}>{date}</strong> ({hours} h). El registro dejará de sumar en los reportes.
        </div>

        {error && (
          <div role="alert" style={{ fontSize: '12px', color: 'var(--error)', background: 'var(--error-soft)', padding: '8px', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label htmlFor="void-reason-input" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Motivo de la anulación (obligatorio)
            </label>
            <textarea
              id="void-reason-input"
              rows={3}
              maxLength={300}
              placeholder="Explica por qué se anula este registro (mín. 5 caracteres)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                fontSize: '13px',
                resize: 'none',
              }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', textAlign: 'right', marginTop: '2px' }}>
              {reason.length}/300
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                background: 'var(--chip-bg)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-muted)',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '13px',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || reason.trim().length < 5}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: 'var(--error)',
                border: 'none',
                color: 'var(--on-primary)',
                fontWeight: 600,
                cursor: submitting || reason.trim().length < 5 ? 'not-allowed' : 'pointer',
                opacity: submitting || reason.trim().length < 5 ? 0.6 : 1,
                fontSize: '13px',
              }}
            >
              {submitting ? 'Anulando...' : 'Confirmar anulación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
