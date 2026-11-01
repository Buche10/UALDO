import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function WithdrawalCloseActions({
  note,
  onChangeNote,
  noteRequired,
  isSupervisorForOther,
  hasAnyKept,
  disabled,
  hasAnyOver,
  onCancel,
}) {
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="close-note" style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 500 }}>
          {noteRequired ? 'Nota explicativa (obligatoria)' : 'Nota u observaciones (opcional)'}
        </label>
        <textarea
          id="close-note"
          rows={2}
          value={note}
          onChange={(e) => onChangeNote(e.target.value)}
          disabled={disabled}
          placeholder={
            isSupervisorForOther
              ? 'Explica por qué cierras el retiro de otro trabajador...'
              : hasAnyKept
              ? 'Explica por qué quedó insumo en el área...'
              : 'Detalles adicionales sobre el uso...'
          }
          className="form-input"
          style={{ padding: '8px 10px', borderRadius: '10px', fontSize: '12px', resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="btn-secondary"
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '9999px',
            fontSize: '13px',
            border: '1px solid var(--border-glass)',
            background: 'var(--surface-soft)',
            color: 'var(--text-main)',
            cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={disabled || hasAnyOver}
          className="btn-primary"
          style={{
            flex: 2,
            padding: '10px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 600,
            background: 'var(--primary)',
            color: 'var(--text-on-primary)',
            border: 'none',
            cursor: disabled || hasAnyOver ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            opacity: disabled || hasAnyOver ? 0.6 : 1,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{disabled ? 'Cerrando...' : 'Confirmar cierre'}</span>
        </button>
      </div>
    </>
  );
}
