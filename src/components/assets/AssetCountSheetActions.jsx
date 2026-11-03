import React from 'react';
import { Save, Send } from 'lucide-react';

export default function AssetCountSheetActions({ onSaveDraft, onSubmit, submitting }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        type="button"
        onClick={onSaveDraft}
        style={{
          padding: '8px 14px',
          borderRadius: '9999px',
          background: 'var(--chip-bg)',
          color: 'var(--text-main)',
          border: '1px solid var(--border-glass)',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Save size={13} /> Guardar borrador
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        style={{
          padding: '8px 16px',
          borderRadius: '9999px',
          background: 'var(--primary)',
          color: 'var(--on-primary)',
          border: 'none',
          fontSize: '12px',
          fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Send size={13} /> {submitting ? 'Enviando...' : 'Enviar conteo'}
      </button>
    </div>
  );
}
