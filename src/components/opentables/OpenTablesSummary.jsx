import React from 'react';
import { Armchair, Receipt, Clock, DollarSign } from 'lucide-react';
import { formatUsd } from '../../services/money';
import { formatReservationTime } from '../reservations/reservationUi';

function Metric({ icon, text, emphasis = false }) {
  return (
    <div
      style={{
        padding: '10px',
        borderRadius: '10px',
        background: 'var(--chip-bg)',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: 0,
      }}
    >
      {icon}
      <span
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: emphasis ? 'var(--accent)' : 'var(--text-main)',
          overflowWrap: 'anywhere',
        }}
      >
        {text}
      </span>
    </div>
  );
}

/**
 * Tarjeta de resumen de mesas abiertas (Brief 47p).
 * Solo pinta los montos que el motor envía.
 */
export default function OpenTablesSummary({ resumen, mesas = [], mostrarMontos = false }) {
  const mesaCount = resumen?.mesas ?? mesas.length;
  const conPrecuenta = resumen?.con_precuenta
    ?? mesas.filter((mesa) => mesa?.precuenta === true).length;
  const masAntigua = formatReservationTime(resumen?.mas_antigua_desde);
  const tienePendiente = resumen?.pendiente !== null
    && resumen?.pendiente !== undefined
    && resumen?.pendiente !== '';

  return (
    <div
      className="glass-card"
      style={{
        padding: '12px',
        border: '1px solid var(--border-glass)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '8px',
      }}
    >
      <Metric
        icon={<Armchair size={14} color="var(--accent)" aria-hidden="true" />}
        text={`Mesas abiertas: ${mesaCount}`}
      />
      <Metric
        icon={<Receipt size={14} color="var(--accent)" aria-hidden="true" />}
        text={`Con precuenta: ${conPrecuenta}`}
      />
      {masAntigua && (
        <Metric
          icon={<Clock size={14} color="var(--accent)" aria-hidden="true" />}
          text={`La más antigua desde ${masAntigua}`}
        />
      )}
      {mostrarMontos && tienePendiente && (
        <Metric
          icon={<DollarSign size={14} color="var(--accent)" aria-hidden="true" />}
          text={`Por cobrar: ${formatUsd(resumen.pendiente)}`}
          emphasis
        />
      )}
    </div>
  );
}
