import React, { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';

/**
 * Muestra una contraseña temporal una sola vez.
 * La contraseña vive únicamente en las props mientras el diálogo está abierto.
 */
export default function TemporaryPasswordDialog({ name, email, password, onClose }) {
  const [copyState, setCopyState] = useState('idle');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'var(--overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="temporary-password-title"
        className="glass-card"
        style={{ width: '100%', maxWidth: '420px', padding: '24px', borderRadius: '20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h3 id="temporary-password-title" style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
              Contraseña temporal
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              {name} · {email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar diálogo"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div
          style={{
            margin: '18px 0',
            padding: '18px 14px',
            borderRadius: '14px',
            background: 'var(--surface-strong)',
            border: '1px solid var(--border-glass)',
            textAlign: 'center',
          }}
        >
          <code
            style={{
              fontFamily: 'monospace',
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--accent)',
              wordBreak: 'break-all',
            }}
          >
            {password}
          </code>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="btn-secondary"
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 600,
            border: '1px solid var(--border-glass)',
            background: 'var(--chip-bg)',
            color: 'var(--accent)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          {copyState === 'copied' ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          <span>{copyState === 'copied' ? 'Copiada' : 'Copiar'}</span>
        </button>

        {copyState === 'error' && (
          <p role="alert" style={{ margin: '10px 0 0 0', fontSize: '12px', color: 'var(--error)' }}>
            No se pudo copiar. Anótala antes de cerrar.
          </p>
        )}

        <p style={{ margin: '16px 0 0 0', fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
          Entrégala en persona. No se vuelve a mostrar. Al entrar por primera vez tendrá que cambiarla.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="btn-primary"
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '11px 16px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
