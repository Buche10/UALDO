import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { listInventory } from '../../services/inventoryClient';
import { registerIncidentWaste } from '../../services/incidentsClient';

export default function IncidentWasteModal({ incidentId, isOpen, onClose, onWasteRegistered }) {
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [location, setLocation] = useState('kitchen');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    listInventory()
      .then((res) => {
        const list = res.ok ? (res.data?.data || res.data || []) : [];
        setItems(list);
        if (list.length > 0) setSelectedItemId(String(list[0].id));
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!selectedItemId) {
      setError('Selecciona un insumo para la merma.');
      return;
    }
    const qty = parseFloat(String(quantity).replace(',', '.'));
    if (isNaN(qty) || qty <= 0) {
      setError('La cantidad debe ser mayor a 0.');
      return;
    }

    setSubmitting(true);
    const res = await registerIncidentWaste(
      incidentId,
      [{ item_id: parseInt(selectedItemId, 10), quantity: String(qty) }],
      location
    );
    setSubmitting(false);

    if (res.ok) {
      onWasteRegistered?.(res.data);
      onClose?.();
    } else {
      setError(res.error || 'No se pudo registrar la merma.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--overlay)',
        zIndex: 130,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--grad-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-glass)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: 'var(--shadow-dialog)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={18} color="var(--warning)" />
            <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', fontWeight: 600 }}>
              Registrar merma por queja
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div role="alert" style={{ fontSize: '12px', color: 'var(--error)', background: 'var(--error-soft)', padding: '8px', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label htmlFor="waste-item" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Insumo mermado</label>
            <select id="waste-item" value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }}>
              {items.map((it) => <option key={it.id} value={it.id}>{it.name} ({it.unit || 'ud'})</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="waste-qty" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Cantidad mermada</label>
            <input id="waste-qty" type="number" step="0.001" min="0.001" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }} />
          </div>

          <div>
            <label htmlFor="waste-location" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Ubicación de descuento</label>
            <select id="waste-location" value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }}>
              <option value="kitchen">Cocina</option>
              <option value="lounge">Salón</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button type="button" onClick={onClose} disabled={submitting} style={{ padding: '8px 14px', borderRadius: '6px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
            <button type="submit" disabled={submitting} style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--primary)', border: '1px solid var(--border-glow)', color: 'var(--on-primary)', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
              {submitting ? 'Guardando...' : 'Confirmar merma'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
