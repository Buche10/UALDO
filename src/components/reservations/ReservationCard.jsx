import React from 'react';
import { Utensils } from 'lucide-react';
import { formatReservationTime, firstName, partyLabel, statusLabel, statusStyle } from './reservationUi';
import { styles } from '../common/uiStyles';

/**
 * Fila de la agenda del día: hora, personas, primer nombre, mesa y platos.
 */
export default function ReservationCard({ reservation, onOpen }) {
  const hasDishes = (reservation.items || []).length > 0;
  return (
    <button
      type="button"
      onClick={() => onOpen(reservation)}
      className="glass-card-interactive"
      style={{ ...styles.card, width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start', color: 'var(--text-main)' }}
    >
      <div style={{ minWidth: '52px', fontWeight: 700, fontSize: '15px', color: 'var(--accent)' }}>
        {formatReservationTime(reservation.reserved_for)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700 }}>{firstName(reservation.customer_name)}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{partyLabel(reservation.party_size)}</span>
          {hasDishes && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 7px', borderRadius: '9999px', background: 'var(--primary-soft)', color: 'var(--accent)', fontSize: '10px', fontWeight: 600 }}>
              <Utensils size={11} aria-hidden="true" />
              <span>Con platos</span>
            </span>
          )}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {reservation.area_note || 'Mesa o sector por definir'}
        </div>
      </div>
      <span style={{ ...statusStyle(reservation.status), padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 600, whiteSpace: 'nowrap' }}>
        {reservation.status_label || statusLabel(reservation.status)}
      </span>
    </button>
  );
}
