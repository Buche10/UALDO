import React from 'react';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function WithdrawalSettingsActions({ saving, loaded, error, success }) {
  return (
    <>
      {error && (
        <div
          role="alert"
          style={{
            padding: '8px 10px',
            borderRadius: '8px',
            background: 'var(--error-soft)',
            color: 'var(--error)',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            padding: '8px 10px',
            borderRadius: '8px',
            background: 'var(--success-soft)',
            color: 'var(--success)',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <CheckCircle2 size={14} />
          <span>Configuración de retiros guardada.</span>
        </div>
      )}

      <button
        type="submit"
        disabled={saving || !loaded}
        className="btn-primary"
        style={{
          alignSelf: 'flex-end',
          marginTop: '6px',
          padding: '8px 16px',
          borderRadius: '9999px',
          background: 'var(--primary)',
          color: 'var(--on-primary)',
          border: 'none',
          fontSize: '12px',
          fontWeight: 600,
          cursor: saving || !loaded ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Save size={14} />
        <span>{saving ? 'Guardando...' : 'Guardar ajustes'}</span>
      </button>
    </>
  );
}
