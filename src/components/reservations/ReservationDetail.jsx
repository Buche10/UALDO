import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, CalendarClock, Pencil, UserX, XCircle, CheckCircle2, Users } from 'lucide-react';
import {
  cancelReservation,
  setReservationStatus,
} from '../../services/reservationsClient';
import { formatReservationDate, formatReservationTime, isFromReservationDay, partyLabel, statusLabel, statusStyle } from './reservationUi';
import ReservationAvailabilityTable from './ReservationAvailabilityTable';
import CancelReservationDialog from './CancelReservationDialog';
import { styles } from '../common/uiStyles';

/**
 * Detalle de una reserva, platos, comprometido y acciones (Brief 39p).
 */
export default function ReservationDetail({ reservation, canManage = false, today, feedback = null, onBack, onEdit, onUpdated }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const canClose = isFromReservationDay(reservation, today);
  const dishes = reservation.items || [];

  const notify = (updated) => {
    if (onUpdated) onUpdated(updated);
  };

  const handleCancel = async (reason) => {
    setBusy('cancel');
    setError(null);
    const res = await cancelReservation(reservation.id, reason);
    setBusy(null);
    if (res.ok && res.data?.data) {
      setCancelOpen(false);
      notify(res.data.data);
      return;
    }
    setError(res.data?.message || res.error || 'No se pudo cancelar la reserva.');
  };

  const handleStatus = async (status) => {
    setBusy(status);
    setError(null);
    const res = await setReservationStatus(reservation.id, status);
    setBusy(null);
    if (res.ok && res.data?.data) {
      notify(res.data.data);
      return;
    }
    setError(res.data?.message || res.error || 'No se pudo actualizar el estado.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <button type="button" onClick={onBack} style={styles.back}>
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Volver a la agenda</span>
      </button>

      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>{reservation.customer_name}</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarClock size={14} aria-hidden="true" />
              <span>{formatReservationDate(reservation.reserved_for)}, {formatReservationTime(reservation.reserved_for)}</span>
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} aria-hidden="true" />
              <span>{partyLabel(reservation.party_size)}. {reservation.area_note || 'Mesa o sector por definir'}.</span>
            </p>
          </div>
          <span style={{ ...statusStyle(reservation.status), padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600 }}>{reservation.status_label || statusLabel(reservation.status)}</span>
        </div>

        {canManage && reservation.customer_contact && (
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text-main)' }}>Contacto: {reservation.customer_contact}</p>
        )}
        {reservation.notes && <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{reservation.notes}</p>}
        {reservation.status === 'cancelada' && reservation.cancel_reason && (
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--error)' }}>Motivo de cancelación: {reservation.cancel_reason}</p>
        )}
      </div>

      <div aria-live="polite">{error && <div style={{ ...styles.errorBox, display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={14} aria-hidden="true" /><span>{error}</span></div>}</div>

      {feedback?.warnings?.map((warning) => (
        <div key={warning} style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--warning-soft)', border: '1px solid var(--warning)', color: 'var(--warning)', fontSize: '12px' }}>{warning}</div>
      ))}
      {feedback?.lowStock?.map((notice) => (
        <div key={notice} style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--warning-soft)', border: '1px solid var(--warning)', color: 'var(--warning)', fontSize: '12px', display: 'flex', gap: '6px' }}>
          <AlertTriangle size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{notice}</span>
        </div>
      ))}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Platos</h4>
        {dishes.length === 0 ? (
          <div style={{ ...styles.card, fontSize: '12px', color: 'var(--text-muted)' }}>Sin platos: solo ocupa la agenda, no compromete stock.</div>
        ) : dishes.map((dish) => (
          <div key={dish.id || dish.runfood_article_id} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{dish.name || `Plato ${dish.runfood_article_id}`}</span>
            <span style={{ color: 'var(--text-muted)' }}>{dish.quantity} {Number(dish.quantity) === 1 ? 'unidad' : 'unidades'}</span>
          </div>
        ))}
      </div>

      <ReservationAvailabilityTable reservation={reservation} />

      {(canManage || canClose) && reservation.status === 'confirmada' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {canManage && (
            <button type="button" onClick={onEdit} style={{ ...styles.secondary, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <Pencil size={14} aria-hidden="true" /><span>Editar</span>
            </button>
          )}
          {canClose && (
            <button type="button" onClick={() => handleStatus('cumplida')} disabled={Boolean(busy)} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <CheckCircle2 size={14} aria-hidden="true" /><span>{busy === 'cumplida' ? 'Guardando...' : 'Cumplida'}</span>
            </button>
          )}
          {canClose && (
            <button type="button" onClick={() => handleStatus('no_show')} disabled={Boolean(busy)} style={{ ...styles.secondary, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <UserX size={14} aria-hidden="true" /><span>{busy === 'no_show' ? 'Guardando...' : 'No vino'}</span>
            </button>
          )}
          {canManage && (
            <button type="button" onClick={() => { setError(null); setCancelOpen(true); }} disabled={Boolean(busy)} style={{ ...styles.secondary, flex: 1, color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <XCircle size={14} aria-hidden="true" /><span>Cancelar</span>
            </button>
          )}
        </div>
      )}

      <CancelReservationDialog
        isOpen={cancelOpen}
        busy={busy === 'cancel'}
        error={error}
        onClose={() => { setCancelOpen(false); setError(null); }}
        onConfirm={handleCancel}
      />
    </div>
  );
}
