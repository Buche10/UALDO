import React from 'react';
import { Clock, Users, UserRound } from 'lucide-react';
import { formatUsd } from '../../services/money';
import { formatReservationTime } from '../reservations/reservationUi';
import {
  formatElapsedMinutes,
  formatOpenTableDayLabel,
  isLongOpenTable,
  openTableElapsedMinutes,
} from './openTablesUi';

function hasValue(value) {
  return value !== null && value !== undefined && value !== '';
}

function mesaLabel(mesa) {
  if (mesa.etiqueta) return mesa.etiqueta;
  return mesa.mesa ? `Mesa ${mesa.mesa}` : 'Mesa sin número';
}

function desdeText(mesa, minutes) {
  const time = formatReservationTime(mesa.abierta_desde);
  if (!time) return '';
  const elapsed = formatElapsedMinutes(minutes);
  return elapsed ? `Desde ${time} (${elapsed})` : `Desde ${time}`;
}

function paxText(mesa) {
  const pax = Number(mesa.pax);
  if (!Number.isFinite(pax) || pax <= 0) return '';
  return pax === 1 ? '1 comensal' : `${pax} comensales`;
}

function Badge({ children, warning = false }) {
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        background: warning ? 'var(--warning-soft)' : 'var(--accent-soft)',
        color: warning ? 'var(--warning)' : 'var(--accent)',
        border: `1px solid ${warning ? 'var(--border-warning)' : 'var(--border-glass)'}`,
      }}
    >
      {children}
    </span>
  );
}

/**
 * Fila de una mesa abierta (Brief 47p).
 * Recalcula la duración con `abierta_desde` y solo pinta los montos que llegan.
 */
export default function OpenTableItem({ mesa, now = new Date() }) {
  if (!mesa) return null;

  const minutes = openTableElapsedMinutes(mesa.abierta_desde, now);
  const longTable = isLongOpenTable(minutes);
  const desde = desdeText(mesa, minutes);
  const pax = paxText(mesa);
  const deAyer = mesa.de_dia_anterior === true;
  const facturado = Number(mesa.facturado);

  return (
    <div
      role="listitem"
      style={{
        padding: '12px',
        borderRadius: '12px',
        background: longTable ? 'var(--warning-soft)' : 'var(--card-subtle-bg)',
        border: `1px solid ${longTable ? 'var(--border-warning)' : 'var(--border-glass)'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
          {mesaLabel(mesa)}
        </span>

        {desde && (
          <span style={{ fontSize: '12px', color: longTable ? 'var(--warning)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} aria-hidden="true" />
            {desde}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
          {mesa.mesero && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <UserRound size={12} aria-hidden="true" />
              {mesa.mesero}
            </span>
          )}
          {pax && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={12} aria-hidden="true" />
              {pax}
            </span>
          )}
        </div>

        {(mesa.precuenta === true || deAyer) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {mesa.precuenta === true && <Badge>Precuenta</Badge>}
            {deAyer && <Badge warning>{formatOpenTableDayLabel(mesa.abierta_desde, now)}</Badge>}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', marginLeft: 'auto' }}>
        {hasValue(mesa.pendiente) && (
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
            Por cobrar {formatUsd(mesa.pendiente)}
          </span>
        )}
        {Number.isFinite(facturado) && facturado > 0 && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Cobrado en parte: {formatUsd(mesa.facturado)}
          </span>
        )}
      </div>
    </div>
  );
}
