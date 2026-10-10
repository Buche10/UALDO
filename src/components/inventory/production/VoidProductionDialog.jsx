import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Confirmación para anular una producción, con motivo obligatorio (Brief 21p).
 */
/** Mantiene el foco dentro del diálogo con Tab y Mayús+Tab. */
function trapTab(e, container) {
  const focusable = Array.from(container?.querySelectorAll('button:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])') || []);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

export default function VoidProductionDialog({ isOpen, voiding, error, onClose, onConfirm, triggerRef, fallbackFocusRef }) {
  const [reason, setReason] = useState('');
  const reasonRef = useRef(null);
  const dialogRef = useRef(null);

  // Solo al abrir: motivo vacío y foco en el motivo. Al cerrar, el foco vuelve
  // al botón que lo abrió o, si ya no existe (tras anular), al respaldo.
  // Un reintento tras un error conserva el motivo.
  useEffect(() => {
    if (!isOpen) return undefined;
    setReason('');
    const triggerEl = triggerRef?.current;
    const fallbackEl = fallbackFocusRef?.current;
    reasonRef.current?.focus();
    return () => {
      if (triggerEl && triggerEl.isConnected) triggerEl.focus();
      else fallbackEl?.focus();
    };
  }, [isOpen, triggerRef, fallbackFocusRef]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !voiding) onClose();
      else if (e.key === 'Tab') trapTab(e, dialogRef.current);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, voiding, onClose]);

  if (!isOpen) return null;

  const canConfirm = reason.trim() !== '' && !voiding;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', backdropFilter: 'blur(8px)', zIndex: 1250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="void-production-title" className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '22px', borderRadius: '16px', border: '1px solid var(--border-glow)', background: 'var(--bg-glass)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 id="void-production-title" style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
          Anular producción
        </h3>

        <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--warning-soft)', border: '1px solid var(--warning)', display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px', color: 'var(--warning)', lineHeight: 1.4 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>Se devuelve la pieza y se retiran las porciones de la ubicación. No se puede deshacer.</span>
        </div>

        <div>
          <label htmlFor="void-production-reason" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
            Motivo
          </label>
          <textarea id="void-production-reason" ref={reasonRef} rows={3} maxLength={255} value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)', fontSize: '13px', resize: 'vertical' }} />
        </div>

        <div aria-live="polite" style={{ fontSize: '12px', color: 'var(--error)' }}>{error || null}</div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={onClose} disabled={voiding} style={{ flex: 1, padding: '11px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}>
            Volver
          </button>
          <button type="button" onClick={() => onConfirm(reason)} disabled={!canConfirm} className="btn-primary" style={{ flex: 1, padding: '11px', borderRadius: '9999px', fontWeight: 600, cursor: canConfirm ? 'pointer' : 'default', opacity: canConfirm ? 1 : 0.6 }}>
            {voiding ? 'Anulando...' : 'Anular'}
          </button>
        </div>
      </div>
    </div>
  );
}
