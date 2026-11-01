import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { escalateCount } from '../../../services/inventoryCountsClient';

export default function EscalateDailyCloseDialog({
  isOpen,
  countId,
  onClose,
  onEscalated,
  triggerRef,
}) {
  const [note, setNote] = useState('');
  const [escalating, setEscalating] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setNote('');
      setError(null);
      setEscalating(false);
      setTimeout(() => {
        if (textareaRef.current) textareaRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !escalating) {
        onClose();
        if (triggerRef?.current) triggerRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, escalating, onClose, triggerRef]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = note.trim();
    if (!trimmed) {
      setError('Debes ingresar un motivo para escalar.');
      return;
    }
    if (trimmed.length > 500) {
      setError('El motivo no puede superar los 500 caracteres.');
      return;
    }

    setEscalating(true);
    setError(null);

    const res = await escalateCount(countId, trimmed);
    setEscalating(false);

    if (res.ok) {
      onClose();
      if (onEscalated) onEscalated(res.data?.data || res.data);
    } else {
      setError(res.error || res.data?.message || 'Error al escalar el cierre.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="escalate-dialog-title"
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'var(--overlay)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="glass-card"
        style={{ width: '100%', maxWidth: '460px', padding: '24px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-warning)', boxShadow: 'var(--shadow-dialog)', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)' }}>
            <AlertTriangle size={18} />
            <h3 id="escalate-dialog-title" style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
              Escalar a administración
            </h3>
          </div>
          {!escalating && (
            <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
              <X size={18} />
            </button>
          )}
        </div>

        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Explica a administración por qué este cierre requiere su intervención.
        </p>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label htmlFor="escalate-note" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Motivo del escalamiento
            </label>
            <textarea
              id="escalate-note"
              ref={textareaRef}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Diferencia de bife sin aclarar con cocina..."
              maxLength={500}
              className="glass-input"
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {note.length} / 500
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={escalating}
              style={{ padding: '8px 16px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '13px', cursor: escalating ? 'not-allowed' : 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={escalating || !note.trim()}
              className="btn-primary"
              style={{ padding: '8px 18px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: escalating || !note.trim() ? 'not-allowed' : 'pointer', opacity: escalating || !note.trim() ? 0.6 : 1 }}
            >
              <ShieldAlert size={14} />
              <span>{escalating ? 'Escalando...' : 'Confirmar escalamiento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
