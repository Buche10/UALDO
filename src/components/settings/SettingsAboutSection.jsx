import React, { useState, useRef, useEffect } from 'react';
import { Copy } from 'lucide-react';

export default function SettingsAboutSection({ googleSheetsWebhookUrl }) {
  const [copiedSheetsUrl, setCopiedSheetsUrl] = useState(false);
  const copyTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopySheetsUrl = async () => {
    if (!googleSheetsWebhookUrl) return;
    try {
      await navigator.clipboard.writeText(googleSheetsWebhookUrl);
      setCopiedSheetsUrl(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedSheetsUrl(false), 2000);
    } catch {}
  };

  return (
    <>
      <div className="glass-card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.5px' }}>
          Apariencia
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Tema Visual Oficial</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Teal Oscuro Premium (#1d1d1b / #00737f)</div>
          </div>
          <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(0,115,127,0.2)', border: '1px solid var(--border-glass)', fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>
            Activo
          </span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.5px' }}>
          Acerca de
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src="/brand/isotipo.png" alt="Isotipo Ualdo" style={{ width: '48px', height: 'auto' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main)' }}>UALDO Mobile</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Versión 1.0.0 (Capacitor Native)</div>
            <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '2px' }}>© 2026 Ualdo Corp. Todos los derechos reservados.</div>
          </div>
        </div>
      </div>

      {googleSheetsWebhookUrl && (
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, letterSpacing: '0.5px' }}>
            Google Sheets ahora lo envía el motor
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            La exportación a Google Sheets se gestiona directamente en el servidor. Copia esta URL para configurarla en el motor con sheets:configure.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-soft)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-main)', wordBreak: 'break-all', flex: 1, fontFamily: 'var(--font-mono)' }}>
              {googleSheetsWebhookUrl}
            </span>
            <button
              type="button"
              onClick={handleCopySheetsUrl}
              className="btn-secondary"
              style={{ padding: '6px 12px', borderRadius: '9999px', fontSize: '11px', cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
            >
              <Copy size={12} />
              <span>{copiedSheetsUrl ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
