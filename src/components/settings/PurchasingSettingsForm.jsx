import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getPurchasingSettings, updatePurchasingSettings } from '../../services/purchasesClient';
import PurchasingSettingsLoadError from './PurchasingSettingsLoadError';
import PurchasingSettingsFields from './PurchasingSettingsFields';

export default function PurchasingSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    base_excess_factor: '1.5',
    receipt_tolerance_pct: '1.0',
    other_purchase_alert_dollars: '50.00',
  });

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const res = await getPurchasingSettings();
    setLoading(false);
    if (res.ok && res.data) {
      const d = res.data.data || res.data;
      setForm({
        base_excess_factor: d.base_excess_factor !== undefined ? String(d.base_excess_factor) : '1.5',
        receipt_tolerance_pct: d.receipt_tolerance_pct !== undefined ? String(d.receipt_tolerance_pct) : '1.0',
        other_purchase_alert_dollars: d.other_purchase_alert_cents !== undefined
          ? (d.other_purchase_alert_cents / 100).toFixed(2)
          : '50.00',
      });
      setLoaded(true);
    } else {
      setLoadError(res.error || 'No se pudo cargar la configuración de compras.');
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

    const factor = parseFloat(form.base_excess_factor);
    const tolerance = parseFloat(form.receipt_tolerance_pct);
    const dollars = parseFloat(form.other_purchase_alert_dollars);

    if (Number.isNaN(factor) || factor <= 0) {
      setSaving(false);
      setError('El factor de exceso debe ser un número mayor a 0.');
      return;
    }
    if (Number.isNaN(tolerance) || tolerance < 0) {
      setSaving(false);
      setError('La tolerancia de recepción debe ser mayor o igual a 0.');
      return;
    }
    if (Number.isNaN(dollars) || dollars < 0) {
      setSaving(false);
      setError('El importe de aviso debe ser mayor o igual a 0.');
      return;
    }

    const payload = {
      base_excess_factor: factor,
      receipt_tolerance_pct: tolerance,
      other_purchase_alert_cents: Math.round(dollars * 100),
    };

    const res = await updatePurchasingSettings(payload);
    setSaving(false);

    if (!res.ok) {
      setError(res.error || 'No se pudo guardar la configuración de compras.');
      return;
    }

    if (res.data) {
      const d = res.data.data || res.data;
      setForm((prev) => ({
        base_excess_factor: d.base_excess_factor !== undefined ? String(d.base_excess_factor) : prev.base_excess_factor,
        receipt_tolerance_pct: d.receipt_tolerance_pct !== undefined ? String(d.receipt_tolerance_pct) : prev.receipt_tolerance_pct,
        other_purchase_alert_dollars: d.other_purchase_alert_cents !== undefined
          ? (d.other_purchase_alert_cents / 100).toFixed(2)
          : prev.other_purchase_alert_dollars,
      }));
    }

    setSuccess(true);
  };

  if (loading) {
    return (
      <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
        Cargando ajustes de compras...
      </div>
    );
  }

  if (loadError && !loaded) {
    return <PurchasingSettingsLoadError loadError={loadError} onRetry={loadSettings} />;
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShoppingBag size={18} color="var(--accent)" />
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
          Ajustes de compras y tolerancias
        </h4>
      </div>

      {error && (
        <div role="alert" style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div role="status" style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--success-soft)', color: 'var(--success)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} />
          <span>Configuración de compras guardada.</span>
        </div>
      )}

      <PurchasingSettingsFields form={form} saving={saving} onChange={handleChange} />

      <button
        type="submit"
        disabled={saving || !loaded}
        className="btn-primary"
        style={{
          alignSelf: 'flex-end',
          marginTop: '6px',
          padding: '8px 16px',
          borderRadius: '9999px',
          background: 'var(--primary)',
          color: 'var(--on-primary)',
          border: 'none',
          fontSize: '12px',
          fontWeight: 600,
          cursor: saving || !loaded ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Save size={14} />
        <span>{saving ? 'Guardando...' : 'Guardar ajustes'}</span>
      </button>
    </form>
  );
}
