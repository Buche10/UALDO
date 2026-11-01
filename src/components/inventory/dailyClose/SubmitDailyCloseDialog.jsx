import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { submitCount, SALES_PENDING_CODE } from '../../../services/inventoryCountsClient';

export default function SubmitDailyCloseDialog({
  isOpen,
  countId,
  savePendingLines,
  onClose,
  onSubmitSuccess,
  triggerRef,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSalesPending, setIsSalesPending] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSalesPending(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
        if (triggerRef?.current) triggerRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose, triggerRef]);

  if (!isOpen) return null;

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setIsSalesPending(false);

    if (savePendingLines) {
      const ok = await savePendingLines();
      if (!ok) {
        setSubmitting(false);
        setError('No se pudieron guardar los últimos cambios del conteo.');
        return;
      }
    }

    const res = await submitCount(countId);
    setSubmitting(false);

    if (res.ok) {
      onClose();
      if (onSubmitSuccess) onSubmitSuccess(res.data?.data || res.data);
    } else {
      if (res.code === SALES_PENDING_CODE) {
        setIsSalesPending(true);
        setError('Falta descontar las ventas del día. Intenta de nuevo en unos minutos.');
      } else {
        setError(res.error || res.data?.message || 'Error al enviar el cierre diario.');
      }
    }
  };

  const btnPill = { padding: '8px 18px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-dialog-title"
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'var(--overlay)', backdropFilter: 'blur(4px)' }}
    >
      <div
        ref={dialogRef}
        className="glass-card"
        style={{ width: '100%', maxWidth: '420px', padding: '24px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 id="submit-dialog-title" style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
            Enviar conteo del día
          </h3>
          {!submitting && (
            <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
              <X size={18} />
            </button>
          )}
        </div>

        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Se calcularán las diferencias con el sistema.
        </p>

        {error && (
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{ padding: '8px 16px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '13px', cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            Cancelar
          </button>

          {isSalesPending ? (
            <button
              type="button"
              onClick={handleConfirmSubmit}
              disabled={submitting}
              className="btn-primary"
              style={{ ...btnPill, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              <RefreshCw size={14} className={submitting ? 'spin' : ''} />
              <span>{submitting ? 'Reintentando...' : 'Reintentar'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmSubmit}
              disabled={submitting}
              className="btn-primary"
              style={{ ...btnPill, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              <CheckCircle2 size={14} />
              <span>{submitting ? 'Enviando...' : 'Confirmar envío'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
