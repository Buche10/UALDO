import React from 'react';

export default function ValidateConfirmDialog({
  isOpen,
  diffCount,
  validating,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'var(--overlay)',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '400px',
          width: '100%',
          padding: '20px',
          borderRadius: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-dialog)',
        }}
      >
        <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: 'var(--text-main)' }}>
          ¿Confirmar validación?
        </h4>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
          Se ajustará el inventario por {diffCount} {diffCount === 1 ? 'diferencia' : 'diferencias'}.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '6px 12px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={validating}
            className="btn-primary"
            style={{ padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600 }}
          >
            {validating ? 'Ajustando...' : 'Confirmar validación'}
          </button>
        </div>
      </div>
    </div>
  );
}
