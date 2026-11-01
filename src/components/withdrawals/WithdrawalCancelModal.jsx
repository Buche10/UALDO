import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cancelWithdrawal } from '../../services/withdrawalsClient';
import { getCancelCapability } from './withdrawalHelpers';

export default function WithdrawalCancelModal({ withdrawal, user, onSuccess, onClose }) {
  const capability = getCancelCapability(withdrawal, user);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    if (capability.requiresNote && note.trim().length < 3) {
      setError('Debes indicar el motivo de la cancelación.');
      return;
    }

    setSubmitting(true);
    setError(null);
    const res = await cancelWithdrawal(withdrawal.id, note.trim() || null);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error || 'No se pudo cancelar el retiro.');
      return;
    }

    onSuccess?.(res.data);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '20px',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-dialog)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)' }}>
            <AlertTriangle size={20} />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              Cancelar retiro
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'var(--error-soft)',
              color: 'var(--error)',
              fontSize: '11px',
            }}
          >
            {error}
          </div>
        )}

        {!capability.canCancel ? (
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Pasaron más de 15 minutos desde que se creó el retiro. Solo un jefe de área o administrador puede cancelarlo.
          </p>
        ) : (
          <>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {capability.isAuthor && capability.remainingMinutes > 0
                ? `Te quedan ${capability.remainingMinutes} min para cancelar directamente sin necesidad de nota.`
                : 'Esta acción devolverá los insumos registrados al stock de bodega.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="cancel-note" style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 500 }}>
                {capability.requiresNote ? 'Motivo de cancelación (obligatorio)' : 'Motivo (opcional)'}
              </label>
              <textarea
                id="cancel-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={submitting}
                placeholder="Explica por qué se cancela el retiro..."
                className="form-input"
                style={{ padding: '6px 8px', borderRadius: '8px', fontSize: '12px', resize: 'vertical' }}
              />
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '8px 14px',
              borderRadius: '9999px',
              border: '1px solid var(--border-glass)',
              background: 'var(--surface-soft)',
              color: 'var(--text-main)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Volver
          </button>
          {capability.canCancel && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || (capability.requiresNote && note.trim().length < 3)}
              style={{
                padding: '8px 14px',
                borderRadius: '9999px',
                border: 'none',
                background: 'var(--error)',
                color: 'var(--text-on-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Cancelando...' : 'Cancelar retiro'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
