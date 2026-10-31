import React from 'react';
import { DollarSign, ShoppingBag, Receipt, Users, Gift, Tag, AlertOctagon } from 'lucide-react';
import { formatUsd } from '../../services/money';

function MetricItem({ icon: Icon, label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '10px 12px',
        borderRadius: '10px',
        background: 'var(--chip-bg)',
        border: '1px solid var(--border-glass)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Icon size={14} color="var(--accent)" />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
        {value}
      </span>
    </div>
  );
}

/**
 * Cifras principales del día (Brief 27p).
 * Muestra "No disponible" si el dato llega en null (nunca 0).
 */
export default function SalesDayMetrics({ summary }) {
  if (!summary) return null;

  const totalText = summary.total != null ? formatUsd(summary.total) : 'No disponible';
  const pedidosText = summary.pedidos != null ? String(summary.pedidos) : 'No disponible';
  const ticketText = summary.ticket_promedio != null ? formatUsd(summary.ticket_promedio) : 'No disponible';
  const mesasText = summary.mesas != null ? String(summary.mesas) : 'No disponible';
  const propinaText = summary.propina != null ? formatUsd(summary.propina) : 'No disponible';
  const descuentoText = summary.descuento != null ? formatUsd(summary.descuento) : 'No disponible';

  let anuladosText = 'No disponible';
  if (summary.anulados != null) {
    const pedidosAnulados = summary.anulados.pedidos ?? 0;
    const totalAnulado = formatUsd(summary.anulados.total ?? '0.00');
    anuladosText = `${pedidosAnulados} (${totalAnulado})`;
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '8px'
      }}
    >
      <MetricItem icon={DollarSign} label="Total vendido" value={totalText} />
      <MetricItem icon={ShoppingBag} label="Pedidos" value={pedidosText} />
      <MetricItem icon={Receipt} label="Ticket promedio" value={ticketText} />
      <MetricItem icon={Users} label="Mesas" value={mesasText} />
      <MetricItem icon={Gift} label="Propinas" value={propinaText} />
      <MetricItem icon={Tag} label="Descuentos" value={descuentoText} />
      <MetricItem icon={AlertOctagon} label="Anulaciones" value={anuladosText} />
    </div>
  );
}
