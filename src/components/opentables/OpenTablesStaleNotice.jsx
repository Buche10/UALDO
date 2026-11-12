import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatReservationTime } from '../reservations/reservationUi';

/**
 * Aviso cuando la lectura de mesas abiertas está vieja o todavía no existe (Brief 47p).
 */
export default function OpenTablesStaleNotice({ desactualizado, capturadaEn }) {
  if (!capturadaEn) {
    return (
      <div
        role="alert"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          borderRadius: '10px',
          background: 'var(--warning-soft)',
          border: '1px solid var(--border-warning)',
          color: 'var(--warning)',
          fontSize: '12px',
          fontWeight: 500,
        }}
      >
        <AlertTriangle size={16} style={{ flexShrink: 0 }} aria-hidden="true" />
        <span>Todavía no llegan datos de mesas desde el local.</span>
      </div>
    );
  }

  if (!desactualizado) return null;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 12px',
        borderRadius: '10px',
        background: 'var(--warning-soft)',
        border: '1px solid var(--border-warning)',
        color: 'var(--warning)',
        fontSize: '12px',
        fontWeight: 500,
      }}
    >
      <AlertTriangle size={16} style={{ flexShrink: 0 }} aria-hidden="true" />
      <span>
        Lectura de las {formatReservationTime(capturadaEn)}: el local no ha enviado mesas desde entonces.
      </span>
    </div>
  );
}
