import React, { useState } from 'react';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { useReservationSubmit } from '../../hooks/useReservations';
import {
  combineDateTime,
  todayGuayaquil,
  MAX_DAYS_AHEAD,
} from '../../services/reservationsClient';
import { addDays, formatReservationTime, reservationDate } from './reservationUi';
import ReservationDishes from './ReservationDishes';
import { styles } from '../common/uiStyles';

const DEFAULT_TIME = '20:00';

function initialForm(reservation) {
  return {
    date: reservation ? reservationDate(reservation.reserved_for) : todayGuayaquil(),
    time: reservation ? formatReservationTime(reservation.reserved_for) : DEFAULT_TIME,
    party_size: reservation ? String(reservation.party_size) : '2',
    customer_name: reservation?.customer_name || '',
    customer_contact: reservation?.customer_contact || '',
    area_note: reservation?.area_note || '',
    notes: reservation?.notes || '',
  };
}

function fieldMessage(errors, key) {
  const value = errors?.[key];
  if (!value) return null;
  return Array.isArray(value) ? value[0] : String(value);
}

/**
 * Alta y edición de una reserva, con platos opcionales (Brief 39p).
 * El contacto solo se muestra a quien tiene reservations.manage.
 */
export default function ReservationForm({ reservation = null, canManageContact = false, onCancel, onSaved }) {
  const [form, setForm] = useState(() => initialForm(reservation));
  const [items, setItems] = useState(() => (reservation?.items || []).map((item) => ({
    runfood_article_id: item.runfood_article_id,
    name: item.name,
    quantity: item.quantity,
  })));
  const [localError, setLocalError] = useState(null);
  const { submitting, error, fieldErrors, submit } = useReservationSubmit({
    reservationId: reservation?.id,
    onSaved,
  });

  const change = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setLocalError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const reservedFor = combineDateTime(form.date, form.time);
    if (!reservedFor) {
      setLocalError('Indica una fecha y una hora válidas.');
      return;
    }
    const data = {
      reserved_for: reservedFor,
      party_size: form.party_size,
      customer_name: form.customer_name,
      area_note: form.area_note,
      notes: form.notes,
      items: items.map((item) => ({ runfood_article_id: item.runfood_article_id, quantity: item.quantity })),
    };
    if (canManageContact) data.customer_contact = form.customer_contact;
    const saved = await submit(data);
    if (!saved) setLocalError(null);
  };

  const today = todayGuayaquil();

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
          {reservation ? 'Editar reserva' : 'Nueva reserva'}
        </h3>
        <button type="button" onClick={onCancel} style={styles.back}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Volver</span>
        </button>
      </div>

      <div aria-live="polite">
        {(error || localError) && (
          <div role="alert" style={{ ...styles.errorBox, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={14} aria-hidden="true" />
            <span>{error || localError}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label htmlFor="reservation-date" style={styles.label}>Fecha</label>
          <input id="reservation-date" type="date" value={form.date} min={today} max={addDays(today, MAX_DAYS_AHEAD)} onChange={(event) => change('date', event.target.value)} style={styles.input} disabled={submitting} />
          {fieldMessage(fieldErrors, 'reserved_for') && <span style={styles.fieldError}>{fieldMessage(fieldErrors, 'reserved_for')}</span>}
        </div>
        <div>
          <label htmlFor="reservation-time" style={styles.label}>Hora</label>
          <input id="reservation-time" type="time" value={form.time} onChange={(event) => change('time', event.target.value)} style={styles.input} disabled={submitting} />
        </div>
        <div>
          <label htmlFor="reservation-party" style={styles.label}>Personas</label>
          <input id="reservation-party" type="number" min="1" max="500" step="1" value={form.party_size} onChange={(event) => change('party_size', event.target.value)} style={styles.input} disabled={submitting} />
          {fieldMessage(fieldErrors, 'party_size') && <span style={styles.fieldError}>{fieldMessage(fieldErrors, 'party_size')}</span>}
        </div>
        <div>
          <label htmlFor="reservation-name" style={styles.label}>Nombre del cliente</label>
          <input id="reservation-name" type="text" maxLength="80" value={form.customer_name} onChange={(event) => change('customer_name', event.target.value)} style={styles.input} disabled={submitting} />
          {fieldMessage(fieldErrors, 'customer_name') && <span style={styles.fieldError}>{fieldMessage(fieldErrors, 'customer_name')}</span>}
        </div>
        {canManageContact && (
          <div>
            <label htmlFor="reservation-contact" style={styles.label}>Contacto (opcional)</label>
            <input id="reservation-contact" type="text" maxLength="80" value={form.customer_contact} onChange={(event) => change('customer_contact', event.target.value)} style={styles.input} disabled={submitting} />
            {fieldMessage(fieldErrors, 'customer_contact') && <span style={styles.fieldError}>{fieldMessage(fieldErrors, 'customer_contact')}</span>}
          </div>
        )}
        <div>
          <label htmlFor="reservation-area" style={styles.label}>Mesa o sector</label>
          <input id="reservation-area" type="text" maxLength="120" value={form.area_note} onChange={(event) => change('area_note', event.target.value)} style={styles.input} disabled={submitting} />
          {fieldMessage(fieldErrors, 'area_note') && <span style={styles.fieldError}>{fieldMessage(fieldErrors, 'area_note')}</span>}
        </div>
      </div>

      <div>
        <label htmlFor="reservation-notes" style={styles.label}>Notas</label>
        <textarea id="reservation-notes" maxLength="500" rows="2" value={form.notes} onChange={(event) => change('notes', event.target.value)} style={{ ...styles.input, resize: 'vertical' }} disabled={submitting} />
        {fieldMessage(fieldErrors, 'notes') && <span style={styles.fieldError}>{fieldMessage(fieldErrors, 'notes')}</span>}
      </div>

      <ReservationDishes items={items} onChange={setItems} disabled={submitting} fieldErrors={fieldErrors} />

      <button type="submit" disabled={submitting} className="btn-primary" style={{ alignSelf: 'flex-end', padding: '10px 18px', borderRadius: '9999px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Save size={15} aria-hidden="true" />
        <span>{submitting ? 'Guardando...' : 'Guardar reserva'}</span>
      </button>
    </form>
  );
}
