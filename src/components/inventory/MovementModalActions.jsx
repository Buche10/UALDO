import React from 'react';

/** Botones de cancelar y registrar de un movimiento. */
export default function MovementModalActions({ submitting, onClose }) {
  return (
    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        style={{
          flex: 1,
          padding: '12px',
          borderRadius: '9999px',
          border: '1px solid var(--border-glass)',
          background: 'transparent',
          color: 'var(--text-muted)',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary"
        style={{ flex: 1, padding: '12px', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer' }}
      >
        {submitting ? 'Registrando...' : 'Registrar'}
      </button>
    </div>
  );
}
