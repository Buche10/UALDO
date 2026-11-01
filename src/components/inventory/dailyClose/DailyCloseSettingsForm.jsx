import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { getDailyCloseSettings, updateDailyCloseSettings } from '../../../services/inventoryCountsClient';
import DailyCloseSettingsFields from './DailyCloseSettingsFields';

export default function DailyCloseSettingsForm() {
  const [reminderTime, setReminderTime] = useState('22:30');
  const [escalationTime, setEscalationTime] = useState('12:00');
  const [selectedLocations, setSelectedLocations] = useState(['kitchen', 'lounge']);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      setLoading(true);
      setErrorMessage(null);
      const res = await getDailyCloseSettings();
      if (!mounted) return;
      setLoading(false);

      if (res.ok && res.data) {
        const data = res.data.data || res.data;
        if (data.reminder_time) setReminderTime(data.reminder_time);
        if (data.escalation_time) setEscalationTime(data.escalation_time);
        if (Array.isArray(data.locations)) setSelectedLocations(data.locations);
      } else {
        setErrorMessage(res.error || res.data?.message || 'No se pudieron cargar los ajustes de cierre diario.');
      }
    };

    fetchSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLocationToggle = (loc) => {
    setSelectedLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    if (selectedLocations.length === 0) {
      setSaving(false);
      setErrorMessage('Debes incluir al menos un área para el cierre diario.');
      return;
    }

    const res = await updateDailyCloseSettings({
      reminder_time: reminderTime,
      escalation_time: escalationTime,
      locations: selectedLocations,
    });
    setSaving(false);

    if (res.ok) {
      setSuccessMessage('Ajustes de cierre diario guardados.');
    } else {
      setErrorMessage(res.error || res.data?.message || 'Error al guardar los ajustes.');
    }
  };

  return (
    <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Clock size={20} color="var(--accent)" />
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
            Cierre diario de inventario
          </h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Horarios de recordatorio, hora límite y áreas requeridas.
          </p>
        </div>
      </div>

      {successMessage && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--success-soft)', border: '1px solid var(--border-success)', color: 'var(--success)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          Cargando configuración...
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <DailyCloseSettingsFields
            reminderTime={reminderTime}
            setReminderTime={setReminderTime}
            escalationTime={escalationTime}
            setEscalationTime={setEscalationTime}
            selectedLocations={selectedLocations}
            onLocationToggle={handleLocationToggle}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              <Save size={14} />
              <span>{saving ? 'Guardando...' : 'Guardar ajustes'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
