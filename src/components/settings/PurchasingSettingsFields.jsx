import React from 'react';

export default function PurchasingSettingsFields({ form, saving, onChange }) {
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="purchasing-factor" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Factor de aviso de exceso sobre la base
        </label>
        <input
          id="purchasing-factor"
          type="number"
          step="0.1"
          min="1"
          max="10"
          value={form.base_excess_factor}
          onChange={(e) => onChange('base_excess_factor', e.target.value)}
          disabled={saving}
          className="form-input"
          style={{ padding: '6px 8px', borderRadius: '8px', fontSize: '12px', maxWidth: '140px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="purchasing-tolerance" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Tolerancia de diferencia en recepción (%)
        </label>
        <input
          id="purchasing-tolerance"
          type="number"
          step="0.1"
          min="0"
          max="50"
          value={form.receipt_tolerance_pct}
          onChange={(e) => onChange('receipt_tolerance_pct', e.target.value)}
          disabled={saving}
          className="form-input"
          style={{ padding: '6px 8px', borderRadius: '8px', fontSize: '12px', maxWidth: '140px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="purchasing-alert" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Importe de aviso para otras compras (USD)
        </label>
        <input
          id="purchasing-alert"
          type="text"
          inputMode="decimal"
          value={form.other_purchase_alert_dollars}
          onChange={(e) => onChange('other_purchase_alert_dollars', e.target.value)}
          disabled={saving}
          className="form-input"
          style={{ padding: '6px 8px', borderRadius: '8px', fontSize: '12px', maxWidth: '140px' }}
        />
      </div>
    </>
  );
}
