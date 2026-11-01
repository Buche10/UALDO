import React from 'react';
import { Save, CheckCircle2, XCircle } from 'lucide-react';
import CountSheetSaveStatus from './CountSheetSaveStatus';

export default function CountSheetActions({
  saveStatus,
  saveErrorMessage,
  lastSavedTime,
  isAppliedOrCancelled,
  isDailyClose,
  countStatus,
  itemsDisabled,
  onSavePending,
  onOpenCancel,
  onOpenApply,
  onOpenSubmit,
  cancelTriggerRef,
  applyTriggerRef,
  submitTriggerRef,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <CountSheetSaveStatus
        saveStatus={saveStatus}
        saveErrorMessage={saveErrorMessage}
        lastSavedTime={lastSavedTime}
      />

      {!isAppliedOrCancelled && !isDailyClose && (
        <>
          <button
            type="button"
            onClick={onSavePending}
            disabled={saveStatus === 'saving'}
            className="glass-card-interactive"
            style={{ padding: '6px 12px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'var(--surface-strong)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Save size={14} />
            <span>Guardar avance</span>
          </button>

          <button
            ref={cancelTriggerRef}
            type="button"
            onClick={onOpenCancel}
            className="glass-card-interactive"
            style={{ padding: '6px 12px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'var(--surface-strong)', color: 'var(--error)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <XCircle size={14} />
            <span>Cancelar conteo</span>
          </button>

          <button
            ref={applyTriggerRef}
            type="button"
            onClick={onOpenApply}
            disabled={itemsDisabled}
            className="btn-primary"
            style={{ padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: itemsDisabled ? 0.5 : 1 }}
          >
            <CheckCircle2 size={14} />
            <span>Aplicar</span>
          </button>
        </>
      )}

      {!isAppliedOrCancelled && isDailyClose && (
        <>
          <button
            type="button"
            onClick={onSavePending}
            disabled={saveStatus === 'saving'}
            className="glass-card-interactive"
            style={{ padding: '6px 12px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'var(--surface-strong)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Save size={14} />
            <span>Guardar avance</span>
          </button>

          {countStatus !== 'submitted' && countStatus !== 'validated' && (
            <button
              ref={submitTriggerRef}
              type="button"
              onClick={onOpenSubmit}
              className="btn-primary"
              style={{ padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <CheckCircle2 size={14} />
              <span>Enviar conteo</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
