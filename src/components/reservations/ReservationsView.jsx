import React, { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Plus, AlertTriangle } from 'lucide-react';
import { getUser } from '../../services/auth';
import { can, ABILITIES } from '../../services/permissions';
import { getReservation, todayGuayaquil } from '../../services/reservationsClient';
import { useReservationRange } from '../../hooks/useReservations';
import { partyLabel, reservationDate, reservationFeedback, reservationsSummary, sortByTime, weekDates } from './reservationUi';
import ReservationDaySelector from './ReservationDaySelector';
import ReservationWeekStrip from './ReservationWeekStrip';
import ReservationCard from './ReservationCard';
import ReservationForm from './ReservationForm';
import ReservationDetail from './ReservationDetail';
import { styles } from '../common/uiStyles';

function weekCounts(dates, items) {
  return dates.reduce((acc, date) => {
    const rows = items.filter((row) => reservationDate(row.reserved_for) === date && row.status !== 'cancelada');
    acc[date] = { count: rows.length, people: rows.reduce((sum, row) => sum + (Number(row.party_size) || 0), 0) };
    return acc;
  }, {});
}

/**
 * Agenda de reservas por día y semana (Brief 39p).
 * Sin id abre la agenda; con params.id abre el detalle de la reserva.
 */
export default function ReservationsView({ user = getUser(), initialId = null, onBack }) {
  const today = todayGuayaquil();
  const canManage = can(user, ABILITIES.RESERVATIONS_MANAGE);
  const [selectedDate, setSelectedDate] = useState(today);
  const [mode, setMode] = useState('list');
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [notice, setNotice] = useState(null);

  const dates = weekDates(selectedDate);
  const day = useReservationRange(selectedDate, selectedDate);
  const week = useReservationRange(dates[0], dates[6]);

  useEffect(() => {
    if (!initialId) return;
    let mounted = true;
    getReservation(initialId)
      .then((res) => {
        if (!mounted) return;
        if (res.ok && res.data?.data) {
          setSelected(res.data.data);
          setFeedback(null);
          setMode('detail');
        } else {
          setNotice(res.error || 'No se pudo abrir la reserva.');
          setMode('list');
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [initialId]);

  const reloadAll = () => {
    day.reload();
    week.reload();
  };

  const changeDay = (date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return;
    setSelectedDate(date);
    setSelected(null);
    setFeedback(null);
    setNotice(null);
    setMode('list');
  };

  const openReservation = (reservation) => {
    setSelected(reservation);
    setFeedback(null);
    setMode('detail');
  };

  const handleSaved = (reservation, warnings, suggestions) => {
    setSelected(reservation);
    setFeedback(reservationFeedback(warnings, suggestions));
    setMode('detail');
    reloadAll();
  };

  const handleUpdated = (reservation) => {
    setSelected(reservation);
    setFeedback(null);
    reloadAll();
  };

  if (mode === 'form') {
    return (
      <ReservationForm
        reservation={selected && selected.status === 'confirmada' ? selected : null}
        canManageContact={canManage}
        onCancel={() => setMode(selected ? 'detail' : 'list')}
        onSaved={handleSaved}
      />
    );
  }

  if (mode === 'detail' && selected) {
    return (
      <ReservationDetail
        reservation={selected}
        canManage={canManage}
        today={today}
        feedback={feedback}
        onBack={() => setMode('list')}
        onEdit={() => setMode('form')}
        onUpdated={handleUpdated}
      />
    );
  }

  const rows = sortByTime(day.items);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onBack && (
            <button type="button" onClick={onBack} aria-label="Volver" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
          )}
          <CalendarDays size={22} color="var(--accent)" aria-hidden="true" />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Reservas</h2>
        </div>
        {canManage && (
          <button type="button" onClick={() => { setSelected(null); setFeedback(null); setMode('form'); }} className="btn-primary" style={{ padding: '8px 14px', borderRadius: '9999px', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Plus size={15} aria-hidden="true" />
            <span>Nueva reserva</span>
          </button>
        )}
      </div>

      <div aria-live="polite">
        {notice && (
          <div style={{ ...styles.errorBox, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} aria-hidden="true" />
            <span>{notice}</span>
          </div>
        )}
      </div>

      <ReservationWeekStrip dates={dates} selected={selectedDate} today={today} counts={weekCounts(dates, week.items)} onSelect={changeDay} />
      <ReservationDaySelector date={selectedDate} today={today} onChange={changeDay} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{reservationsSummary(rows)}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{partyLabel(rows.reduce((sum, row) => sum + (Number(row.party_size) || 0), 0))}</span>
      </div>

      {day.loading && rows.length === 0 ? (
        <div style={styles.muted}>Cargando reservas...</div>
      ) : day.error ? (
        <div style={{ ...styles.errorBox, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <span>{day.error}</span>
          <button type="button" onClick={day.reload} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '9999px' }}>Reintentar</button>
        </div>
      ) : rows.length === 0 ? (
        <div style={styles.muted}>No hay reservas para este día.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {rows.map((reservation) => (
            <ReservationCard key={reservation.id} reservation={reservation} onOpen={openReservation} />
          ))}
        </div>
      )}
    </div>
  );
}
