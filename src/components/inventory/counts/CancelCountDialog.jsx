import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Diálogo accesible de confirmación para cancelar un conteo en borrador.
 */
export default function CancelCountDialog({
  isOpen,
  cancelling,
  error,
  onClose,
  onConfirm,
  triggerRef,
}) {
  const initialFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const triggerEl = triggerRef?.current;
      initialFocusRef.current?.focus();

      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !cancelling) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        if (triggerEl) {
          triggerEl.focus();
        }
      };
    }
  }, [isOpen, cancelling, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay)',
        backdropFilter: 'blur(8px)',
        zIndex: 1250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-dialog-title"
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-glow)',
          background: 'var(--bg-glass)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3
            id="cancel-dialog-title"
            style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <AlertTriangle size={18} color="var(--warning)" />
            <span>Cancelar Conteo</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={cancelling}
            aria-label="Cerrar diálogo"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          aria-live="polite"
          style={{
            fontSize: '12px',
            color: 'var(--error)',
            minHeight: error ? '16px' : '0px',
            background: error ? 'var(--error-soft)' : 'transparent',
            padding: error ? '8px 10px' : 0,
            borderRadius: '8px',
            border: error ? '1px solid var(--border-error)' : 'none',
          }}
        >
          {error || null}
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          El conteo se cancela y no cambia el stock. No se puede deshacer.
        </p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button
            ref={initialFocusRef}
            type="button"
            onClick={onClose}
            disabled={cancelling}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '9999px',
              border: '1px solid var(--border-glass)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={cancelling}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '9999px',
              border: 'none',
              background: 'var(--error)',
              color: 'var(--text-light)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {cancelling ? 'Cancelando...' : 'Confirmar cancelación'}
          </button>
        </div>
      </div>
    </div>
  );
}
