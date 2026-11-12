import React from 'react';
import { AlertTriangle, Armchair, CheckCircle2, Clock, UserRound } from 'lucide-react';
import { formatUsd } from '../../services/money';
import { formatReservationTime } from '../reservations/reservationUi';

function hasValue(value) {
  return value !== null && value !== undefined && value !== '';
}

function mesaCountText(count) {
  return count === 1 ? '1 mesa sin cobrar' : `${count} mesas sin cobrar`;
}

function Badge({ children }) {
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        background: 'var(--warning-soft)',
        color: 'var(--warning)',
        border: '1px solid var(--border-warning)',
      }}
    >
      {children}
    </span>
  );
}

function DetalleMesa({ mesa }) {
  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: '10px',
        background: 'var(--surface-soft)',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{mesa.etiqueta}</strong>
        {hasValue(mesa.pendiente) && (
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>
            Por cobrar {formatUsd(mesa.pendiente)}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
        {mesa.mesero && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <UserRound size={12} aria-hidden="true" />
            {mesa.mesero}
          </span>
        )}
        {hasValue(mesa.abierta_desde) && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} aria-hidden="true" />
            Desde {formatReservationTime(mesa.abierta_desde)}
          </span>
        )}
        {mesa.precuenta === true && <Badge>Precuenta</Badge>}
      </div>
    </div>
  );
}

/**
 * Bloque de mesas abiertas al cierre en el detalle del cierre (Brief 47p).
 * Si el motor no manda el bloque, no pinta nada.
 */
export default function CashCloseOpenTables({ bloque }) {
  if (!bloque || typeof bloque !== 'object') return null;

  const estado = bloque.estado;
  const mesas = Number(bloque.mesas);
  const detalle = Array.isArray(bloque.detalle) ? bloque.detalle : [];

  if (estado === 'pendiente') {
    return <Notice text="Todavía no llega la lectura de mesas posterior al cierre." />;
  }

  if (estado === 'sin_dato') {
    return <Notice text="No llegó la lectura de mesas de esa noche." />;
  }

  if (estado !== 'evaluado') return null;

  if (!Number.isFinite(mesas) || mesas <= 0) {
    return (
      <div className="glass-card" style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <CheckCircle2 size={14} color="var(--success)" aria-hidden="true" />
        <span>Sin mesas abiertas al cierre.</span>
      </div>
    );
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        border: '1px solid var(--border-warning)',
        background: 'var(--warning-soft)',
      }}
    >
      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Armchair size={15} aria-hidden="true" />
        <span>Mesas abiertas al cierre</span>
      </h4>
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-main)' }}>
        {mesaCountText(mesas)} en RunFood
        {hasValue(bloque.pendiente) ? ` por ${formatUsd(bloque.pendiente)}` : ''}.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {detalle.map((mesa, index) => (
          <DetalleMesa key={mesa?.etiqueta ?? `mesa-${index}`} mesa={mesa || {}} />
        ))}
      </div>
    </div>
  );
}

function Notice({ text }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        color: 'var(--warning)',
        border: '1px solid var(--border-warning)',
        background: 'var(--warning-soft)',
      }}
    >
      <AlertTriangle size={14} style={{ flexShrink: 0 }} aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
