import React, { useState, useEffect } from 'react';
import { Clock, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { getCashCloseSettings, updateCashCloseSettings } from '../../services/cashCloseClient';

export default function CashCloseSettingsForm() {
  const [headDeclaration, setHeadDeclaration] = useState(true);
  const [reminderTime, setReminderTime] = useState('23:00');
  const [escalationTime, setEscalationTime] = useState('11:00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let mounted = true;
    getCashCloseSettings()
      .then((res) => {
        if (!mounted) return;
        setLoading(false);
        if (res.ok && res.data) {
          const cfg = res.data.data || res.data;
          if (cfg.head_declaration !== undefined) setHeadDeclaration(Boolean(cfg.head_declaration));
          if (cfg.reminder_time) setReminderTime(cfg.reminder_time);
          if (cfg.escalation_time) setEscalationTime(cfg.escalation_time);
        } else {
          setError(res.error || 'No se pudo cargar la configuración de cierre.');
        }
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
        setError('Error al conectar con el servidor.');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(reminderTime) || reminderTime > '23:45') {
      setError('La hora del recordatorio debe tener formato HH:MM y ser como máximo 23:45.');
      return;
    }
    if (!timeRegex.test(escalationTime) || escalationTime > '23:45') {
      setError('La hora límite de escalamiento debe tener formato HH:MM y ser como máximo 23:45.');
      return;
    }

    setSaving(true);
    const res = await updateCashCloseSettings({
      head_declaration: headDeclaration,
      reminder_time: reminderTime,
      escalation_time: escalationTime,
    });
    setSaving(false);

    if (res.ok) {
      setSuccess('Ajustes guardados correctamente.');
    } else {
      setError(res.error || 'No se pudieron guardar los ajustes.');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
        Cargando ajustes de cierre...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Cierre por el jefe de salón</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              El cierre automático queda en borrador esperando la declaración del jefe de salón.
            </p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="head_declaration"
              checked={headDeclaration}
              onChange={(e) => setHeadDeclaration(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              Lo declara el jefe de salón
            </span>
          </label>
        </div>

        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="reminder_time" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="var(--accent)" />
              <span>Hora del recordatorio (jefe de salón)</span>
            </label>
            <input
              id="reminder_time"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)',
                background: 'var(--bg-input, var(--chip-bg))',
                color: 'var(--text-main)',
                fontSize: '13px',
                maxWidth: '160px',
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Aviso si el cierre de hoy sigue sin declarar (por defecto 23:00, máx. 23:45).
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="escalation_time" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="var(--warning)" />
              <span>Hora límite y escalamiento (administración)</span>
            </label>
            <input
              id="escalation_time"
              type="time"
              value={escalationTime}
              onChange={(e) => setEscalationTime(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)',
                background: 'var(--bg-input, var(--chip-bg))',
                color: 'var(--text-main)',
                fontSize: '13px',
                maxWidth: '160px',
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Aviso a administración si el cierre de ayer no fue declarado (por defecto 11:00, máx. 23:45).
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div role="status" style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--success-soft)', border: '1px solid var(--border-success)', color: 'var(--success)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="btn-primary"
        style={{
          padding: '10px 20px',
          borderRadius: '9999px',
          fontSize: '13px',
          fontWeight: 600,
          border: 'none',
          background: 'var(--accent)',
          color: 'var(--bg-dark)',
          cursor: saving ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          alignSelf: 'flex-start',
        }}
      >
        {saving && <RefreshCw size={14} className="spin" />}
        <span>{saving ? 'Guardando...' : 'Guardar ajustes'}</span>
      </button>
    </form>
  );
}
