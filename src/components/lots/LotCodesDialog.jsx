import React from 'react';
import { PackageCheck } from 'lucide-react';

function findLine(purchase, lineId) {
  return (purchase?.lines || []).find((line) => Number(line.id) === Number(lineId));
}

/**
 * Códigos de lote para escribir a mano en cada funda (Brief 40p).
 * No se cierra tocando fuera ni con Escape: solo con "Listo, ya los anoté".
 */
export default function LotCodesDialog({ isOpen, purchase, lots = [], onDone }) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', backdropFilter: 'blur(8px)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="lot-codes-title" className="glass-card" style={{ width: '100%', maxWidth: '460px', padding: '22px', borderRadius: '16px', border: '1px solid var(--border-glow)', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PackageCheck size={20} color="var(--accent)" />
          <h3 id="lot-codes-title" style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
            Códigos de lote
          </h3>
        </div>

        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>
          Escribe este número en cada funda
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
          Usa el código del corte que estás guardando. Así sabremos qué carne usar primero.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lots.map((entry) => {
            const line = findLine(purchase, entry.line_id);
            return (
              <div key={`${entry.line_id}-${entry.code}`} style={{ padding: '12px', borderRadius: '12px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {line?.item_name || 'Corte de carne'}
                </span>
                <span style={{ fontSize: '40px', lineHeight: 1.1, fontWeight: 800, letterSpacing: '2px', color: 'var(--ualdo-negro)', background: 'var(--ualdo-blanco)', borderRadius: '10px', padding: '6px 12px', alignSelf: 'flex-start' }}>
                  {entry.code}
                </span>
                {line?.quantity && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Recibido: {line.quantity} {line.unit || ''}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button type="button" onClick={onDone} className="btn-primary" style={{ padding: '12px', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer' }}>
          Listo, ya los anoté
        </button>
      </div>
    </div>
  );
}
