import React, { useState, useEffect } from 'react';
import { X, Sliders } from 'lucide-react';
import { getIncidentSettings, updateIncidentSettings } from '../../services/incidentsClient';

export default function IncidentSettingsModal({ isOpen, onClose }) {
  const [reminder, setReminder] = useState('24');
  const [escalation, setEscalation] = useState('72');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getIncidentSettings()
      .then((res) => {
        setLoading(false);
        if (res.ok && res.data) {
          if (res.data.averia_reminder_hours) setReminder(String(res.data.averia_reminder_hours));
          if (res.data.averia_escalation_hours) setEscalation(String(res.data.averia_escalation_hours));
        }
      })
      .catch(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const rem = parseInt(reminder, 10);
    const esc = parseInt(escalation, 10);
    if (isNaN(rem) || rem < 1 || isNaN(esc) || esc < 1) {
      setError('Las horas deben ser números enteros mayores a 0.');
      return;
    }
    if (esc <= rem) {
      setError('El escalamiento a administración debe ser mayor que el recordatorio.');
      return;
    }

    setSubmitting(true);
    const res = await updateIncidentSettings({
      averia_reminder_hours: rem,
      averia_escalation_hours: esc,
    });
    setSubmitting(false);

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => onClose?.(), 1000);
    } else {
      setError(res.error || 'No se pudieron guardar los ajustes.');
    }
  };

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)', zIndex: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'var(--grad-surface)', borderRadius: '12px', border: '1px solid var(--border-glass)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--shadow-dialog)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', fontWeight: 600 }}>Ajustes de seguimiento</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {error && <div role="alert" style={{ fontSize: '12px', color: 'var(--error)', background: 'var(--error-soft)', padding: '6px 8px', borderRadius: '4px' }}>{error}</div>}
        {success && <div role="status" style={{ fontSize: '12px', color: 'var(--success)', background: 'var(--success-soft)', padding: '6px 8px', borderRadius: '4px' }}>Ajustes guardados correctamente.</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '14px', color: 'var(--text-muted)', fontSize: '12px' }}>Cargando ajustes...</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label htmlFor="set-rem" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Horas para recordar avería al asignado</label>
              <input id="set-rem" type="number" min="1" max="720" value={reminder} onChange={(e) => setReminder(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }} />
            </div>

            <div>
              <label htmlFor="set-esc" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Horas para escalar avería a administración</label>
              <input id="set-esc" type="number" min="1" max="720" value={escalation} onChange={(e) => setEscalation(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button type="button" onClick={onClose} disabled={submitting} style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>Cancelar</button>
              <button type="submit" disabled={submitting} style={{ padding: '8px 14px', borderRadius: '6px', background: 'var(--primary)', border: 'none', color: 'var(--on-primary)', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
                {submitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
