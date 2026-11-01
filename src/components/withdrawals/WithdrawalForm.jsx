import React, { useState, useRef } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { createWithdrawal } from '../../services/withdrawalsClient';
import { generateClientUuid } from '../../hooks/useMovementSubmit';
import WithdrawalFormItems from './WithdrawalFormItems';
import WithdrawalFormLateFields from './WithdrawalFormLateFields';

const PURPOSE_SUGGESTIONS = ['Producción', 'Mise en place', 'Servicio'];

export default function WithdrawalForm({ user, onSuccess, onCancel }) {
  const [items, setItems] = useState([
    { tempId: 'temp_1', item_id: null, name: '', unit: '', quantity: '' },
  ]);

  const defaultLocation = user?.area === 'lounge' ? 'lounge' : 'kitchen';
  const [toLocation, setToLocation] = useState(defaultLocation);
  const [purpose, setPurpose] = useState('');
  const [isLate, setIsLate] = useState(false);
  const [withdrawnAt, setWithdrawnAt] = useState('');
  const [lateReason, setLateReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [lineErrors, setLineErrors] = useState({});

  const clientUuidRef = useRef(generateClientUuid());

  const handleAddItem = () => {
    if (items.length >= 15) return;
    setItems((prev) => [
      ...prev,
      { tempId: `temp_${Date.now()}_${Math.random()}`, item_id: null, name: '', unit: '', quantity: '' },
    ]);
  };

  const handleRemoveItem = (tempId) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.tempId !== tempId));
  };

  const handleItemChange = (tempId, updates) => {
    setItems((prev) =>
      prev.map((it) => (it.tempId === tempId ? { ...it, ...updates } : it))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLineErrors({});

    if (items.some((it) => !it.item_id)) {
      setError('Selecciona todos los insumos de la lista antes de declarar.');
      return;
    }

    setSubmitting(true);
    const payload = {
      items: items.map((it) => ({ item_id: it.item_id, name: it.name, quantity: it.quantity })),
      to_location: toLocation,
      purpose,
      client_uuid: clientUuidRef.current,
    };

    if (isLate) {
      payload.withdrawn_at = withdrawnAt || new Date().toISOString();
      payload.late_reason = lateReason;
    }

    const res = await createWithdrawal(payload);
    setSubmitting(false);

    if (res.ok) {
      onSuccess?.(res.data?.data || res.data);
    } else {
      if (res.status === 409) clientUuidRef.current = generateClientUuid();
      if (res.lineErrors) setLineErrors(res.lineErrors);
      setError(res.error || res.data?.message || 'Error al declarar el retiro.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
        >
          <ArrowLeft size={16} />
          <span>Volver a retiros</span>
        </button>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
          Declarar retiro de bodega
        </h3>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="withdrawal-to-location" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Destino del insumo
        </label>
        <select
          id="withdrawal-to-location"
          value={toLocation}
          onChange={(e) => setToLocation(e.target.value)}
          disabled={submitting}
          className="form-input"
          style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px' }}
        >
          <option value="kitchen">Cocina</option>
          <option value="lounge">Salón</option>
        </select>
      </div>

      <WithdrawalFormItems
        items={items}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        onItemChange={handleItemChange}
        lineErrors={lineErrors}
        disabled={submitting}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="withdrawal-purpose" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Motivo del retiro (3 a 200 caracteres)
        </label>
        <input
          id="withdrawal-purpose"
          type="text"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Ej. Tiramisú, Mise en place para el almuerzo..."
          maxLength={200}
          disabled={submitting}
          className="glass-input"
          style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px' }}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {PURPOSE_SUGGESTIONS.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => setPurpose(sug)}
              disabled={submitting}
              className="chip-btn"
              style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '9999px' }}
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      <WithdrawalFormLateFields
        isLate={isLate}
        onToggleLate={setIsLate}
        withdrawnAt={withdrawnAt}
        onChangeWithdrawnAt={setWithdrawnAt}
        lateReason={lateReason}
        onChangeLateReason={setLateReason}
        disabled={submitting}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          style={{ padding: '8px 16px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary"
          style={{ padding: '8px 18px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: submitting ? 'not-allowed' : 'pointer' }}
        >
          <CheckCircle2 size={16} />
          <span>{submitting ? 'Declarando...' : 'Declarar retiro'}</span>
        </button>
      </div>
    </form>
  );
}
