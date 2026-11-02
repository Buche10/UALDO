import React from 'react';
import { Tag, Truck, FileText, Scale, CircleAlert } from 'lucide-react';
import { formatQuantity } from '../../services/quantityFormat';
import { LOT_STATUS_LABELS, formatMoneyCents, formatUnitCost } from './lotFormat';

const rowLabel = { fontSize: '11px', color: 'var(--text-muted)' };
const rowValue = { fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 };

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
      <Icon size={14} color="var(--text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={rowLabel}>{label}</div>
        <div style={rowValue}>{value || 'Sin dato'}</div>
      </div>
    </div>
  );
}

/** Cabecera de trazabilidad de un lote. */
export default function LotTraceSummary({ lot, canSeeCosts }) {
  const purchase = lot.purchase;
  return (
    <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '24px', fontWeight: 800, letterSpacing: '1px', color: 'var(--text-main)' }}>
          <Tag size={18} color="var(--accent)" />
          {lot.code}
        </span>
        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '9999px', background: lot.status === 'no_apto' ? 'var(--error-soft)' : 'var(--success-soft)', color: lot.status === 'no_apto' ? 'var(--error)' : 'var(--success)', fontWeight: 700 }}>
          {LOT_STATUS_LABELS[lot.status] || lot.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
        <InfoRow icon={Scale} label="Corte" value={lot.item?.name} />
        <InfoRow icon={Truck} label="Proveedor" value={lot.supplier?.name} />
        <InfoRow icon={FileText} label="Compra y factura" value={purchase ? `${purchase.invoice_number || `Compra ${purchase.id}`}${purchase.purchased_on ? ` · ${purchase.purchased_on}` : ''}` : 'Lote inicial sin compra'} />
        <InfoRow icon={Scale} label="Peso recibido" value={`${formatQuantity(lot.received_weight)} kg`} />
        <InfoRow icon={FileText} label="Fecha de recepción" value={lot.received_on} />
        {canSeeCosts && lot.cost && (
          <InfoRow icon={FileText} label="Costo" value={`${formatUnitCost(lot.cost.unit_cost)} por unidad · ${formatMoneyCents(lot.cost.line_total_cents)}`} />
        )}
      </div>

      {lot.status === 'no_apto' && lot.unfit && (
        <div style={{ display: 'flex', gap: '7px', padding: '9px 10px', borderRadius: '9px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px' }}>
          <CircleAlert size={15} style={{ flexShrink: 0 }} />
          <div>
            <strong>Lote no apto.</strong> {lot.unfit.reason}
            {lot.unfit.at ? ` (${lot.unfit.at.slice(0, 10)})` : ''}
          </div>
        </div>
      )}
    </div>
  );
}
