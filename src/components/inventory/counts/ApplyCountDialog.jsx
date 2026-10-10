import React, { useEffect, useRef } from 'react';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useApplyCount } from '../../../hooks/useApplyCount';
import { formatQuantity } from '../../../services/quantityFormat';
import { isLineCounted } from '../../../hooks/countSheetLines';

function sortAppliedLines(lines) {
  if (!lines || !Array.isArray(lines)) return [];
  return [...lines].sort((a, b) => {
    const hasA = a.difference !== null && a.difference !== undefined;
    const hasB = b.difference !== null && b.difference !== undefined;
    if (!hasA && !hasB) return 0;
    if (!hasA) return 1;
    if (!hasB) return -1;
    const diffA = Math.abs(Number(a.difference));
    const diffB = Math.abs(Number(b.difference));
    return diffB - diffA;
  });
}

export default function ApplyCountDialog({
  isOpen,
  countId,
  countDetail,
  items,
  quantities,
  onClose,
  savePendingLines,
  onAppliedComplete,
  triggerRef,
}) {
  const initialFocusRef = useRef(null);
  const { applying, error, appliedDetail, confirmAndApply } = useApplyCount({
    countId,
    onAppliedSuccess: onAppliedComplete,
    savePendingLines,
  });

  useEffect(() => {
    if (isOpen) {
      const triggerEl = triggerRef?.current;
      initialFocusRef.current?.focus();
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !applying) {
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
  }, [isOpen, applying, onClose, triggerRef]);

  if (!isOpen) return null;

  let countedCount = 0;
  let uncountedCount = 0;
  // Contado = lo guardado en el motor o un cambio válido que se guarda antes de
  // aplicar; un campo en blanco con cantidad guardada sigue contado.
  items.forEach((item) => {
    if (isLineCounted(quantities[item.id])) {
      countedCount++;
    } else {
      uncountedCount++;
    }
  });

  const sortedLines = sortAppliedLines(appliedDetail?.lines);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay)',
        backdropFilter: 'blur(8px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-dialog-title"
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-glow)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-glass)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 id="apply-dialog-title" style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            {appliedDetail ? 'Resultado del Conteo Aplicado' : 'Confirmar y Aplicar Conteo'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={applying}
            aria-label="Cerrar diálogo"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          aria-live="polite"
          style={{
            minHeight: error ? '16px' : '0px',
            padding: error ? '10px' : 0,
            borderRadius: '8px',
            background: error ? 'var(--error-soft)' : 'transparent',
            color: 'var(--error)',
            fontSize: '12px',
            marginBottom: error ? '14px' : '0px',
            border: error ? '1px solid var(--border-error)' : 'none',
          }}
        >
          {error || null}
        </div>

        {!appliedDetail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', fontSize: '13px' }}>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ubicación: </span>
                <strong style={{ color: 'var(--accent)' }}>{countDetail?.location_label || countDetail?.location}</strong>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Insumos contados: </span>
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>{countedCount}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No contados (se conservan): </span>
                  <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{uncountedCount}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--warning-soft)', border: '1px solid var(--warning)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '12px', color: 'var(--warning)', lineHeight: 1.4 }}>
                El conteo es absoluto: reemplaza el stock de esta ubicación por lo contado. Aplícalo con el local sin ventas en curso.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                ref={initialFocusRef}
                type="button"
                onClick={onClose}
                disabled={applying}
                style={{ flex: 1, padding: '12px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmAndApply}
                disabled={applying}
                className="btn-primary"
                style={{ flex: 1, padding: '12px', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <CheckCircle2 size={16} />
                <span>{applying ? 'Aplicando...' : 'Confirmar y Aplicar'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0 }}>
            <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--success-soft)', color: 'var(--success)', fontSize: '12px', border: '1px solid var(--border-success)', fontWeight: 600 }}>
              Conteo aplicado exitosamente en el motor.
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {sortedLines.map((line) => {
                const diffVal = line.difference;
                const hasDiff = diffVal !== null && diffVal !== undefined;
                const diffNum = hasDiff ? Number(diffVal) : null;
                const isDiffZero = diffNum === 0;
                let diffText = 'Sin dato';
                if (hasDiff) {
                  diffText = diffNum > 0 ? `+${formatQuantity(diffNum)}` : formatQuantity(diffNum);
                }

                return (
                  <div
                    key={line.id || line.item_id}
                    style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {line.item_name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center' }}>
                        <span>Sistema: {formatQuantity(line.system_quantity)}</span>
                        <span style={{ display: 'inline-block', width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-subtle)', margin: '0 6px' }} aria-hidden="true" />
                        <span>Contado: {formatQuantity(line.counted_quantity)} {line.unit || ''}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: !hasDiff || isDiffZero ? 'var(--text-muted)' : diffNum > 0 ? 'var(--success)' : 'var(--error)',
                        }}
                      >
                        {diffText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              ref={initialFocusRef}
              type="button"
              onClick={onClose}
              className="btn-primary"
              style={{ padding: '12px', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer', marginTop: '10px' }}
            >
              Cerrar y Regresar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
