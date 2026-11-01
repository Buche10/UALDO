import React, { useState } from 'react';
import { PackagePlus, AlertCircle, X } from 'lucide-react';
import { receiveExtra } from '../../../services/purchasesClient';
import { styles } from './purchaseUi';

export default function ReceiveExtraModal({ isOpen, purchaseId, line, onClose, onReceived }) {
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !line) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const cleanQty = quantity.trim();
    if (!cleanQty || Number(cleanQty) <= 0) {
      setError('Indica una cantidad mayor que 0.');
      return;
    }

    setSubmitting(true);
    const res = await receiveExtra(purchaseId, line.id, cleanQty);
    setSubmitting(false);

    if (res.ok) {
      onReceived?.();
      onClose();
    } else {
      setError(res.error || 'No se pudo registrar la entrega complementaria.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="receive-extra-title" className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-glow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackagePlus size={18} color="var(--accent)" />
            <h3 id="receive-extra-title" style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Llegó el resto
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar modal" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
          Registra la entrega complementaria de <strong>{line.item_name}</strong> por parte del proveedor.
        </p>

        {error && (
          <div role="alert" style={{ ...styles.errorBox, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label htmlFor="extra-qty" style={styles.label}>Cantidad entregada ({line.unit})</label>
            <input id="extra-qty" type="text" inputMode="decimal" placeholder="0.000" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={styles.input} />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} disabled={submitting} style={{ ...styles.secondary, flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontWeight: 600 }}>
              {submitting ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
