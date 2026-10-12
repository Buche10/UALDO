import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

/** Mantiene el foco dentro del diálogo con Tab y Mayús+Tab. */
function trapTab(e, container) {
  // Los botones con aria-disabled siguen siendo enfocables; los disabled no.
  const focusable = Array.from(container?.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])') || []);
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

/**
 * Confirmación propia y accesible (Briefs 20p y 22p): `role="dialog"`, Escape, foco
 * inicial en "Volver", Tab dentro y, al cerrar, el foco vuelve al botón que lo
 * abrió o, si ya no existe, al respaldo. Mientras procesa, los botones usan
 * `aria-disabled` (no `disabled`) para que el foco no salga del diálogo.
 * `children` agrega campos (por ejemplo, el motivo de un rechazo) e
 * `initialFocusRef`, el campo que recibe el foco al abrir.
 */
export default function ConfirmDialog({ isOpen, title, message, confirmLabel, busy, error, onConfirm, onClose, triggerRef, fallbackFocusRef, initialFocusRef, children }) {
  const dialogRef = useRef(null);
  const backRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const triggerEl = triggerRef?.current;
    const fallbackEl = fallbackFocusRef?.current;
    (initialFocusRef?.current || backRef.current)?.focus();
    return () => {
      if (triggerEl && triggerEl.isConnected) triggerEl.focus();
      else fallbackEl?.focus();
    };
  }, [isOpen, triggerRef, fallbackFocusRef, initialFocusRef]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
      else if (e.key === 'Tab') trapTab(e, dialogRef.current);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, busy, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', backdropFilter: 'blur(8px)', zIndex: 1250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message" className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '22px', borderRadius: '16px', border: '1px solid var(--border-glow)', background: 'var(--bg-glass)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 id="confirm-dialog-title" style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{title}</h3>
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--warning-soft)', border: '1px solid var(--warning)', display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px', color: 'var(--warning)', lineHeight: 1.4 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span id="confirm-dialog-message">{message}</span>
        </div>
        {children}
        <div aria-live="polite" style={{ fontSize: '12px', color: 'var(--error)' }}>{error || null}</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button ref={backRef} type="button" onClick={() => { if (!busy) onClose(); }} aria-disabled={busy} style={{ flex: 1, padding: '11px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}>
            Volver
          </button>
          <button type="button" onClick={() => { if (!busy) onConfirm(); }} aria-disabled={busy} className="btn-primary" style={{ flex: 1, padding: '11px', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer' }}>
            {busy ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
