import React, { useState } from 'react';
import { ShoppingBag, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getUser } from '../../services/auth';
import { can, ABILITIES } from '../../services/permissions';
import { updatePurchaseParams } from '../../services/purchasesClient';

function ParamField({ id, label, value, unit, onChange, disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <label htmlFor={id} style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        {label}{unit ? ` (${unit})` : ''}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder="0.000"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="form-input"
        style={{
          padding: '6px 8px',
          borderRadius: '8px',
          fontSize: '12px',
          border: '1px solid var(--border-glass)',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
        }}
      />
    </div>
  );
}

export default function ItemPurchaseParams({ item, onSaved }) {
  const currentUser = getUser();
  const canManage = can(currentUser, ABILITIES.PURCHASES_MANAGE);

  const [base, setBase] = useState(
    item?.base_quantity !== null && item?.base_quantity !== undefined ? String(item.base_quantity) : ''
  );
  const [min, setMin] = useState(
    item?.min_stock !== null && item?.min_stock !== undefined ? String(item.min_stock) : ''
  );
  const [reorder, setReorder] = useState(
    item?.reorder_point !== null && item?.reorder_point !== undefined ? String(item.reorder_point) : ''
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!canManage || !item?.id) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const payload = {
      base_quantity: base.trim() === '' ? null : base.trim(),
      min_stock: min.trim() === '' ? null : min.trim(),
      reorder_point: reorder.trim() === '' ? null : reorder.trim(),
    };

    const res = await updatePurchaseParams(item.id, payload);
    setSaving(false);

    if (res.ok) {
      setSuccess(true);
      onSaved?.(res.data?.data || res.data);
    } else {
      setError(res.error || 'No se pudieron guardar los parámetros de compra.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: '10px',
        padding: '12px',
        borderRadius: '10px',
        background: 'var(--surface-soft)',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ShoppingBag size={14} color="var(--accent)" />
        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Compra</h4>
      </div>

      {error && (
        <div role="alert" style={{ padding: '6px 8px', borderRadius: '6px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div role="status" style={{ padding: '6px 8px', borderRadius: '6px', background: 'var(--success-soft)', color: 'var(--success)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={13} />
          <span>Parámetros de compra guardados.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
        <ParamField id={`item-${item.id}-base`} label="Base" value={base} unit={item.unit} onChange={(v) => { setBase(v); setSuccess(false); }} disabled={saving} />
        <ParamField id={`item-${item.id}-min`} label="Mínimo" value={min} unit={item.unit} onChange={(v) => { setMin(v); setSuccess(false); }} disabled={saving} />
        <ParamField id={`item-${item.id}-reorder`} label="Punto reposición" value={reorder} unit={item.unit} onChange={(v) => { setReorder(v); setSuccess(false); }} disabled={saving} />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-primary"
        style={{
          alignSelf: 'flex-end',
          marginTop: '4px',
          padding: '6px 14px',
          borderRadius: '9999px',
          background: 'var(--primary)',
          color: 'var(--on-primary)',
          border: 'none',
          fontSize: '12px',
          fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
        }}
      >
        <Save size={13} />
        <span>{saving ? 'Guardando...' : 'Guardar'}</span>
      </button>
    </form>
  );
}
