import React, { useCallback, useEffect, useState } from 'react';
import { Tags, CheckCircle2, AlertCircle } from 'lucide-react';
import { DEFAULT_AGE_ALERT_DAYS, getLotSettings, updateLotSettings } from '../../services/lotsClient';

/** Días del aviso de antigüedad de lotes (Brief 40p, settings.manage). */
export default function LotSettingsForm() {
  const [days, setDays] = useState(String(DEFAULT_AGE_ALERT_DAYS));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getLotSettings();
    setLoading(false);
    if (res.ok) {
      const value = Number(res.data?.data?.age_alert_days);
      setDays(String(Number.isInteger(value) && value > 0 ? value : DEFAULT_AGE_ALERT_DAYS));
    } else {
      setError(res.error || 'No se pudo cargar el aviso de antigüedad.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    const res = await updateLotSettings({ age_alert_days: days });
    setSaving(false);
    if (!res.ok) {
      setError(res.data?.message || res.error || 'No se pudo guardar el aviso de antigüedad.');
      return;
    }
    const value = Number(res.data?.data?.age_alert_days);
    if (Number.isInteger(value) && value > 0) setDays(String(value));
    setSuccess(true);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Tags size={18} color="var(--accent)" />
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
          Aviso de antigüedad de lotes
        </h4>
      </div>
      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
        Ualdo avisa cuando un lote activo con saldo llega a estos días. No lo marca no apto: la decisión es humana.
      </p>

      {loading ? (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cargando ajuste...</span>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '160px' }}>
          <label htmlFor="lots-age-days" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Días de aviso
          </label>
          <input
            id="lots-age-days"
            type="text"
            inputMode="numeric"
            value={days}
            onChange={(event) => { setDays(event.target.value.replace(/[^0-9]/g, '')); setSuccess(false); }}
            disabled={saving}
            className="form-input"
            style={{ padding: '7px 9px', borderRadius: '8px', fontSize: '12px' }}
          />
        </div>
      )}

      <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {error && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--error)' }}>
            <AlertCircle size={13} />
            <span>{error}</span>
          </span>
        )}
        {success && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--success)' }}>
            <CheckCircle2 size={13} />
            <span>Aviso de antigüedad guardado.</span>
          </span>
        )}
      </div>

      <button type="submit" disabled={saving || loading} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
        {saving ? 'Guardando...' : 'Guardar aviso'}
      </button>
    </form>
  );
}
