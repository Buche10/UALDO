import React from 'react';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { formatQuantity } from '../../services/quantityFormat';
import { locationLabel } from '../../services/inventoryLocations';
import { MOVEMENT_KIND_LABELS } from './lotFormat';

function movementDate(value) {
  if (!value) return 'Sin fecha';
  const text = String(value);
  return `${text.slice(0, 10)} ${text.slice(11, 16)}`;
}

/** Movimientos del lote con los saltos de FIFO resaltados. */
export default function LotMovements({ movements, page = 1, onPage }) {
  const rows = movements?.data || [];
  const meta = movements?.meta || {};
  const current = Number(meta.current_page || page);
  const last = Number(meta.last_page || 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {rows.length === 0 ? (
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Sin movimientos registrados.</p>
      ) : rows.map((movement) => (
        <div key={movement.id} style={{ padding: '9px 10px', borderRadius: '9px', background: movement.fifo_skipped ? 'var(--warning-soft)' : 'var(--surface-soft)', border: movement.fifo_skipped ? '1px solid var(--warning)' : '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
              {MOVEMENT_KIND_LABELS[movement.kind] || movement.kind} · {movement.item || 'Insumo'}
            </span>
            <strong style={{ fontSize: '12px', color: Number(movement.quantity) < 0 ? 'var(--error)' : 'var(--success)', whiteSpace: 'nowrap' }}>
              {Number(movement.quantity) > 0 ? '+' : ''}{formatQuantity(movement.quantity)}
            </strong>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {locationLabel(movement.location)} · {movement.user || 'Sin usuario'} · {movementDate(movement.created_at)}
          </div>
          {movement.fifo_skipped && (
            <div style={{ display: 'flex', gap: '5px', fontSize: '11px', color: 'var(--warning)' }}>
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />
              <span>Saltó el FIFO: {movement.justification || 'Sin justificación'}</span>
            </div>
          )}
        </div>
      ))}

      {last > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={() => onPage(current - 1)} disabled={current <= 1} style={{ background: 'transparent', border: 'none', color: current <= 1 ? 'var(--text-subtle)' : 'var(--accent)', cursor: current <= 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
            <ArrowLeft size={13} />
            <span>Anterior</span>
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Página {current} de {last}</span>
          <button type="button" onClick={() => onPage(current + 1)} disabled={current >= last} style={{ background: 'transparent', border: 'none', color: current >= last ? 'var(--text-subtle)' : 'var(--accent)', cursor: current >= last ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
            <span>Siguiente</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
