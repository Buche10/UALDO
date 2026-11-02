import React from 'react';
import { Wrench, ShieldAlert, MessageSquareWarning } from 'lucide-react';

export default function ReportTypeSelector({ onSelectType }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
        ¿Qué tipo de problema ocurrió?
      </p>
      <button
        type="button"
        onClick={() => onSelectType('averia')}
        style={{
          padding: '16px',
          borderRadius: '10px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glass)',
          color: 'var(--text-main)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'left',
        }}
      >
        <Wrench size={24} color="var(--warning)" />
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>Algo se dañó</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Avería de equipo, electrodoméstico o instalación
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onSelectType('rotura')}
        style={{
          padding: '16px',
          borderRadius: '10px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glass)',
          color: 'var(--text-main)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'left',
        }}
      >
        <ShieldAlert size={24} color="var(--error)" />
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>Se rompió algo</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Vajilla, cristalería, menaje o elementos de sala
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onSelectType('queja')}
        style={{
          padding: '16px',
          borderRadius: '10px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glass)',
          color: 'var(--text-main)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'left',
        }}
      >
        <MessageSquareWarning size={24} color="var(--accent)" />
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>Queja de un cliente</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Plato devuelto, demora o reclamo sobre el servicio
          </div>
        </div>
      </button>
    </div>
  );
}
