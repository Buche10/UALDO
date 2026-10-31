import React, { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { getSupplySettings, updateSupplySettings } from '../../services/supplyRequestsClient';
import { styles } from '../common/uiStyles';

const TIME_FORMAT = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_TIME = '23:45';

export function validateReminderTime(time) {
  const trimmed = String(time ?? '').trim();
  if (!trimmed) return 'La hora es obligatoria.';
  if (!TIME_FORMAT.test(trimmed)) return 'Formato inválido. Usa HH:MM (24 horas).';
  if (trimmed > MAX_TIME) return 'La hora máxima permitida es 23:45.';
  return null;
}

/**
 * Ajuste del aviso de faltantes al personal (Brief 28p, punto 31).
 * Solo visible para el dueño del negocio.
 */
export default function SupplyReminderSettings() {
  const [enabled, setEnabled] = useState(true);
  const [time, setTime] = useState('21:30');
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getSupplySettings();
    setLoading(false);
    if (res.ok && res.data) {
      setEnabled(Boolean(res.data.faltantes_reminder_enabled));
      setTime(String(res.data.faltantes_reminder_time || '21:30'));
      setLoaded(true);
    } else {
      setError(res.error || res.data?.message || 'No se pudieron cargar los ajustes.');
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e) => {
    e?.preventDefault();
    setSuccess(null);
    setError(null);
    setFieldErrors({});

    const timeErr = validateReminderTime(time);
    if (timeErr) {
      setFieldErrors({ faltantes_reminder_time: timeErr });
      return;
    }

    setSaving(true);
    const res = await updateSupplySettings({
      faltantes_reminder_enabled: enabled,
      faltantes_reminder_time: time,
    });
    setSaving(false);

    if (res.ok) {
      setSuccess('Aviso guardado correctamente.');
      if (res.data) {
        setEnabled(Boolean(res.data.faltantes_reminder_enabled));
        setTime(String(res.data.faltantes_reminder_time || time));
      }
    } else {
      const errs = res.data?.errors || {};
      const timeMsg = errs.faltantes_reminder_time?.[0];
      const enabledMsg = errs.faltantes_reminder_enabled?.[0];
      if (timeMsg) setFieldErrors({ faltantes_reminder_time: timeMsg });
      else if (enabledMsg) setFieldErrors({ faltantes_reminder_enabled: enabledMsg });
      else setError(res.data?.message || res.error || 'No se pudieron guardar los ajustes.');
    }
  };

  if (loading && !loaded) {
    return <div style={{ ...styles.card, fontSize: '12px', color: 'var(--text-muted)' }}>Cargando ajuste de aviso...</div>;
  }

  if (!loaded && error) {
    return (
      <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
        <div role="alert" style={{ ...styles.errorBox, display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={14} /><span>{error}</span></div>
        <button type="button" onClick={fetchSettings} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '4px 12px', fontSize: '11px', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer' }}>Reintentar</button>
      </div>
    );
  }

  return (
    <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bell size={15} color="var(--accent)" />
          <span>Aviso de faltantes al personal</span>
        </h4>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            disabled={saving}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-main)' }}>
            {enabled ? 'Activado' : 'Desactivado'}
          </span>
        </label>
      </div>

      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
        Hora en que se envía el aviso automático al personal para que reporten insumos faltantes antes del cierre.
      </p>

      {error && (
        <div role="alert" style={{ ...styles.errorBox, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '12px', fontWeight: 500 }}>
          <CheckCircle2 size={14} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <label htmlFor="reminder-time-input" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Hora del aviso (HH:MM)
          </label>
          <input
            id="reminder-time-input"
            type="time"
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              if (fieldErrors.faltantes_reminder_time) {
                setFieldErrors({});
              }
            }}
            disabled={saving || !enabled}
            style={{
              ...styles.input,
              width: '120px',
              padding: '4px 8px',
              fontSize: '12px',
              opacity: enabled ? 1 : 0.6,
            }}
          />
          {fieldErrors.faltantes_reminder_time && (
            <span style={{ fontSize: '11px', color: 'var(--error)' }}>
              {fieldErrors.faltantes_reminder_time}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', paddingTop: '18px' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '9999px', fontWeight: 600 }}
          >
            {saving ? 'Guardando...' : 'Guardar horario'}
          </button>
        </div>
      </form>
    </div>
  );
}
