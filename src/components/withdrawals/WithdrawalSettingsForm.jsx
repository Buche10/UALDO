import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { getWithdrawalSettings, updateWithdrawalSettings } from '../../services/withdrawalsClient';
import WithdrawalSettingsQuietHours from './WithdrawalSettingsQuietHours';
import WithdrawalSettingsIntervals from './WithdrawalSettingsIntervals';
import WithdrawalSettingsLoadError from './WithdrawalSettingsLoadError';
import WithdrawalSettingsActions from './WithdrawalSettingsActions';

export default function WithdrawalSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    reminder_after_minutes: 120,
    reminder_interval_minutes: 120,
    max_reminders: 3,
    quiet_start: '02:00',
    quiet_end: '09:00',
  });

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const res = await getWithdrawalSettings();
    setLoading(false);
    if (res.ok && res.data) {
      setForm({
        reminder_after_minutes: res.data.reminder_after_minutes ?? 120,
        reminder_interval_minutes: res.data.reminder_interval_minutes ?? 120,
        max_reminders: res.data.max_reminders ?? 3,
        quiet_start: res.data.quiet_start ?? '02:00',
        quiet_end: res.data.quiet_end ?? '09:00',
      });
      setLoaded(true);
    } else {
      setLoadError(res.error || 'No se pudo cargar la configuración de retiros.');
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const payload = {
      reminder_after_minutes: parseInt(form.reminder_after_minutes, 10),
      reminder_interval_minutes: parseInt(form.reminder_interval_minutes, 10),
      max_reminders: parseInt(form.max_reminders, 10),
      quiet_start: form.quiet_start,
      quiet_end: form.quiet_end,
    };

    const res = await updateWithdrawalSettings(payload);
    setSaving(false);

    if (!res.ok) {
      setError(res.error || 'No se pudo guardar la configuración.');
      return;
    }

    if (res.data) {
      setForm((prev) => ({
        reminder_after_minutes: res.data.reminder_after_minutes ?? prev.reminder_after_minutes,
        reminder_interval_minutes: res.data.reminder_interval_minutes ?? prev.reminder_interval_minutes,
        max_reminders: res.data.max_reminders ?? prev.max_reminders,
        quiet_start: res.data.quiet_start ?? prev.quiet_start,
        quiet_end: res.data.quiet_end ?? prev.quiet_end,
      }));
    }

    setSuccess(true);
  };

  if (loading) {
    return (
      <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
        Cargando ajustes de retiros...
      </div>
    );
  }

  if (loadError && !loaded) {
    return <WithdrawalSettingsLoadError loadError={loadError} onRetry={loadSettings} />;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card"
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        borderRadius: '14px',
        border: '1px solid var(--border-glass)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={18} color="var(--accent)" />
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
          Recordatorios de retiros de bodega
        </h4>
      </div>

      <WithdrawalSettingsIntervals
        afterMinutes={form.reminder_after_minutes}
        intervalMinutes={form.reminder_interval_minutes}
        onChange={handleChange}
        disabled={saving}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="settings-max" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Máximo de recordatorios antes de escalar
        </label>
        <input
          id="settings-max"
          type="number"
          min="1"
          max="10"
          value={form.max_reminders}
          onChange={(e) => handleChange('max_reminders', e.target.value)}
          disabled={saving}
          className="form-input"
          style={{ padding: '6px 8px', borderRadius: '8px', fontSize: '12px', maxWidth: '140px' }}
        />
      </div>

      <WithdrawalSettingsQuietHours
        quietStart={form.quiet_start}
        quietEnd={form.quiet_end}
        onChange={handleChange}
        disabled={saving}
      />

      <WithdrawalSettingsActions
        saving={saving}
        loaded={loaded}
        error={error}
        success={success}
      />
    </form>
  );
}
