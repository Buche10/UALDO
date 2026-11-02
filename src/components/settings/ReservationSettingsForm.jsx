import React, { useCallback, useEffect, useState } from 'react';
import { CalendarClock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getReservationSettings, updateReservationSettings, isValidTime } from '../../services/reservationsClient';
import { styles } from '../common/uiStyles';

/**
 * Ajustes de las horas de aviso de reservas (Brief 39p), solo settings.manage.
 */
export default function ReservationSettingsForm() {
  const [form, setForm] = useState({ day_before_time: '16:00', same_day_time: '11:00' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getReservationSettings();
    setLoading(false);
    if (res.ok && res.data) {
      const data = res.data.data || res.data;
      setForm({
        day_before_time: String(data.day_before_time || '16:00'),
        same_day_time: String(data.same_day_time || '11:00'),
      });
      setLoaded(true);
    } else {
      setError(res.error || 'No se pudieron cargar los ajustes de reservas.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const change = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(null);
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!isValidTime(form.day_before_time)) errors.day_before_time = ['Formato inválido. Usa HH:MM (24 horas).'];
    if (!isValidTime(form.same_day_time)) errors.same_day_time = ['Formato inválido. Usa HH:MM (24 horas).'];
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    const res = await updateReservationSettings(form);
    setSaving(false);
    if (res.ok) {
      const data = res.data?.data || res.data || form;
      setForm({
        day_before_time: String(data.day_before_time || form.day_before_time),
        same_day_time: String(data.same_day_time || form.same_day_time),
      });
      setSuccess('Avisos de reservas guardados.');
      return;
    }
    setFieldErrors(res.data?.errors || {});
    setError(res.data?.message || res.error || 'No se pudieron guardar los ajustes.');
  };

  if (loading && !loaded) {
    return <div style={{ ...styles.card, fontSize: '12px', color: 'var(--text-muted)' }}>Cargando ajustes de reservas...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CalendarClock size={18} color="var(--accent)" aria-hidden="true" />
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Avisos de reservas</h4>
      </div>
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
        Hora del aviso al salón el día anterior y el mismo día de la reserva.
      </p>

      {error && (
        <div role="alert" style={{ ...styles.errorBox, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={14} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '12px' }}>
          <CheckCircle2 size={14} aria-hidden="true" />
          <span>{success}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <label htmlFor="reservation-day-before" style={styles.label}>Día anterior</label>
          <input id="reservation-day-before" type="time" value={form.day_before_time} onChange={(event) => change('day_before_time', event.target.value)} disabled={saving} style={{ ...styles.input, width: '130px', padding: '6px 8px', fontSize: '12px' }} />
          {fieldErrors.day_before_time && <span style={styles.fieldError}>{fieldErrors.day_before_time[0]}</span>}
        </div>
        <div>
          <label htmlFor="reservation-same-day" style={styles.label}>Mismo día</label>
          <input id="reservation-same-day" type="time" value={form.same_day_time} onChange={(event) => change('same_day_time', event.target.value)} disabled={saving} style={{ ...styles.input, width: '130px', padding: '6px 8px', fontSize: '12px' }} />
          {fieldErrors.same_day_time && <span style={styles.fieldError}>{fieldErrors.same_day_time[0]}</span>}
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-primary" style={{ alignSelf: 'flex-end', padding: '8px 16px', borderRadius: '9999px', fontWeight: 600, fontSize: '12px' }}>
        {saving ? 'Guardando...' : 'Guardar avisos'}
      </button>
    </form>
  );
}
