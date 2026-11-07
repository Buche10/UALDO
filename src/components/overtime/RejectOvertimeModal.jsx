import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export default function RejectOvertimeModal({ entry, onConfirm, onCancel, submitting = false }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);

  if (!entry) return null;

  const workerName = entry.worker?.name || entry.worker_name || 'Trabajador';
  const hours = entry.hours ?? 0;
  const date = entry.work_date || '';

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = note.trim();
    if (trimmed.length < 3) {
      setError('El motivo debe tener al menos 3 caracteres.');
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
      aria-labelledby="reject-overtime-title"
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
          <h3 id="reject-overtime-title" style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)', fontWeight: 600 }}>
            Rechazar horas extra
          </h3>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          Vas a rechazar el registro de <strong style={{ color: 'var(--text-main)' }}>{workerName}</strong> del día <strong style={{ color: 'var(--text-main)' }}>{date}</strong> ({hours} h). Explica la razón para que el equipo esté al tanto.
        </div>

        {error && (
          <div role="alert" style={{ fontSize: '12px', color: 'var(--error)', background: 'var(--error-soft)', padding: '8px', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label htmlFor="reject-note-input" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Motivo del rechazo (obligatorio)
            </label>
            <textarea
              id="reject-note-input"
              rows={3}
              maxLength={300}
              placeholder="Explica por qué se rechaza este registro (mín. 3 caracteres)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
              {note.length}/300
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              style={{
                padding: '8px 14px',
                borderRadius: '9999px',
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
              disabled={submitting || note.trim().length < 3}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                background: 'var(--error)',
                border: 'none',
                color: 'var(--on-primary)',
                fontWeight: 600,
                cursor: submitting || note.trim().length < 3 ? 'not-allowed' : 'pointer',
                opacity: submitting || note.trim().length < 3 ? 0.6 : 1,
                fontSize: '13px',
              }}
            >
              {submitting ? 'Rechazando...' : 'Rechazar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
