import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function CountSheetHeader({ countDetail, showSystemQty, onToggleSystemQty }) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Planilla de Conteo: {countDetail?.location_label || countDetail?.location}
          </h3>
          {countDetail?.notes && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{countDetail.notes}</p>
          )}
        </div>
        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', background: 'var(--chip-bg)', color: 'var(--accent)', fontWeight: 600 }}>
          {countDetail?.status === 'draft' ? 'Borrador' : countDetail?.status === 'applied' ? 'Aplicado' : 'Cancelado'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-glass)' }}>
        <button
          type="button"
          onClick={onToggleSystemQty}
          style={{ background: 'transparent', border: 'none', color: showSystemQty ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: 0 }}
        >
          {showSystemQty ? <Eye size={16} /> : <EyeOff size={16} />}
          <span>Ver cantidad del sistema</span>
        </button>
        <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
          (Conteo a ciegas {showSystemQty ? 'desactivado' : 'activo'})
        </span>
      </div>
    </div>
  );
}
