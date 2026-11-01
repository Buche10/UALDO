import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle2, ArrowLeft, Save } from 'lucide-react';
import { listRequests, savePurchaseOutcome } from '../../services/supplyRequestsClient';
import { styles } from '../common/uiStyles';
import PurchaseOutcomeRow from './PurchaseOutcomeRow';

export default function PurchaseOutcomePanel({ onBack, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [saving, setSaving] = useState(false);
  const [itemsList, setItemsList] = useState([]);
  const [outcomes, setOutcomes] = useState({});

  const loadApprovedItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await listRequests({ status: 'approved' });
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'No se pudieron cargar los pedidos aprobados.');
      return;
    }
    const requests = Array.isArray(res.data) ? res.data : res.data?.data || [];
    const flattened = [];
    requests.forEach((req) => {
      (req.items || []).forEach((it) => {
        flattened.push({
          ...it,
          requestId: req.id,
          requesterName: req.requester?.name || 'Personal',
        });
      });
    });
    setItemsList(flattened);
  }, []);

  useEffect(() => {
    loadApprovedItems();
  }, [loadApprovedItems]);

  const handleSetOutcome = (itemId, outcome) => {
    setOutcomes((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        outcome,
        purchased_quantity: outcome === 'purchased' ? '' : (prev[itemId]?.purchased_quantity || ''),
      },
    }));
    setError(null);
    setSuccess(null);
  };

  const handleFieldChange = (itemId, field, value) => {
    setOutcomes((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        [field]: value,
      },
    }));
  };

  const validateAndBuildPayload = () => {
    const payloadItems = [];
    for (const item of itemsList) {
      const state = outcomes[item.id];
      if (!state || !state.outcome) continue;
      const itemName = item.name || item.free_text_name;

      if (state.outcome === 'partial') {
        const qty = String(state.purchased_quantity || '').trim();
        const reason = String(state.reason || '').trim();
        if (!qty || Number(qty) <= 0) return { error: `Indica la cantidad comprada para ${itemName}.` };
        if (!reason) return { error: `Indica el motivo de la compra parcial para ${itemName}.` };
        payloadItems.push({ supply_request_item_id: item.id, outcome: 'partial', purchased_quantity: qty, reason });
      } else if (state.outcome === 'not_purchased') {
        const reason = String(state.reason || '').trim();
        if (!reason) return { error: `Indica el motivo por el cual no se compró ${itemName}.` };
        payloadItems.push({ supply_request_item_id: item.id, outcome: 'not_purchased', reason });
      } else if (state.outcome === 'purchased') {
        payloadItems.push({ supply_request_item_id: item.id, outcome: 'purchased' });
      }
    }
    return { payloadItems };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const { error: valError, payloadItems } = validateAndBuildPayload();
    if (valError) {
      setError(valError);
      return;
    }
    if (!payloadItems || payloadItems.length === 0) {
      setError('Selecciona el resultado de al menos un ítem.');
      return;
    }

    setSaving(true);
    const res = await savePurchaseOutcome(payloadItems);
    setSaving(false);

    if (res.ok) {
      const count = res.data?.data?.updated ?? res.data?.updated ?? payloadItems.length;
      setSuccess(`Se guardaron ${count} resultados de compra.`);
      setOutcomes({});
      await loadApprovedItems();
      onSaved?.();
    } else {
      setError(res.error || 'No se pudieron guardar los resultados de compra.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <button type="button" onClick={onBack} style={styles.back}>
          <ArrowLeft size={16} />
          <span>Volver a compras</span>
        </button>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
          Registrar compra del día
        </span>
      </div>

      {error && (
        <div role="alert" style={{ ...styles.errorBox, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div role="status" style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--success-soft)', color: 'var(--success)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando ítems aprobados...
        </div>
      ) : itemsList.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '24px' }}>
          No hay ítems aprobados pendientes de registrar compra.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {itemsList.map((item) => (
            <PurchaseOutcomeRow
              key={item.id}
              item={item}
              current={outcomes[item.id]}
              onSetOutcome={handleSetOutcome}
              onFieldChange={handleFieldChange}
            />
          ))}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{
              padding: '10px 16px',
              borderRadius: '9999px',
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '6px',
            }}
          >
            <Save size={15} />
            <span>{saving ? 'Guardando...' : 'Guardar resultados'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
