import React from 'react';
import { ChevronRight, Clock, Tag } from 'lucide-react';
import { formatQuantity } from '../../services/quantityFormat';
import { ageLabel, daysSinceReceived, isAgeWarning, LOT_STATUS_LABELS } from './lotFormat';
import LotBalances from './LotBalances';

const statusStyle = (status) => {
  if (status === 'no_apto') return { background: 'var(--error-soft)', color: 'var(--error)' };
  if (status === 'agotado') return { background: 'var(--badge-inactive-bg)', color: 'var(--badge-inactive-color)' };
  return { background: 'var(--success-soft)', color: 'var(--success)' };
};

/** Ficha de un lote en la lista FIFO. */
export default function LotCard({ lot, alertDays, onOpen }) {
  const days = daysSinceReceived(lot.received_on);
  const warning = isAgeWarning(days, alertDays);
  const status = statusStyle(lot.status);

  return (
    <button
      type="button"
      onClick={() => onOpen(lot.id)}
      className="glass-card-interactive"
      style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-card)', border: warning ? '1px solid var(--warning)' : '1px solid var(--border-glass)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '16px', fontWeight: 800, letterSpacing: '1px', color: 'var(--text-main)' }}>
              <Tag size={14} color="var(--accent)" />
              {lot.code}
            </span>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '9999px', background: status.background, color: status.color, fontWeight: 700 }}>
              {LOT_STATUS_LABELS[lot.status] || lot.status}
            </span>
            {warning && (
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '9999px', background: 'var(--warning-soft)', color: 'var(--warning)', fontWeight: 700, border: '1px solid var(--border-warning)' }}>
                Pasado el plazo
              </span>
            )}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>{lot.item || 'Corte sin nombre'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {lot.supplier ? `${lot.supplier} · ` : ''}Recibido {lot.received_on || 'sin fecha'} · {formatQuantity(lot.received_weight)} kg
          </div>
        </div>
        <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: warning ? 'var(--warning)' : 'var(--text-muted)' }}>
        <Clock size={12} />
        <span>{ageLabel(days)}</span>
      </div>

      <LotBalances balances={lot.balances} emptyText="Sin saldo en este momento." />
    </button>
  );
}
