import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { resolveLine } from '../../../services/purchasesClient';
import { styles } from './purchaseUi';

const RESOLUTIONS = [
  { value: 'proveedor_completa', label: 'Proveedor completa (entrega posterior)' },
  { value: 'nota_de_credito', label: 'Nota de crédito' },
  { value: 'error_de_pesaje', label: 'Error de pesaje (corregir stock)' },
  { value: 'aceptado', label: 'Aceptado (asumir diferencia)' },
];

export default function ResolveLineModal({ isOpen, purchaseId, line, onClose, onResolved }) {
  const [resolution, setResolution] = useState('proveedor_completa');
  const [note, setNote] = useState('');
  const [correctedQty, setCorrectedQty] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !line) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!note.trim()) {
      setError('El motivo o nota de la resolución es obligatorio.');
      return;
    }
    if (resolution === 'error_de_pesaje' && (!correctedQty.trim() || Number(correctedQty) < 0)) {
      setError('Indica la cantidad corregida.');
      return;
    }

    setSubmitting(true);
    const res = await resolveLine(purchaseId, line.id, {
      resolution,
      note: note.trim(),
      corrected_quantity: resolution === 'error_de_pesaje' ? correctedQty.trim() : undefined,
    });
    setSubmitting(false);

    if (res.ok) {
      onResolved?.();
      onClose();
    } else {
      setError(res.error || 'No se pudo resolver la incidencia.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="resolve-title" className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-glow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 id="resolve-title" style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Resolver diferencia
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
              {line.item_name} (Diferencia: {line.difference_quantity} {line.unit})
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar modal" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div role="alert" style={{ ...styles.errorBox, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label htmlFor="resolve-resolution" style={styles.label}>Resolución</label>
            <select id="resolve-resolution" value={resolution} onChange={(e) => setResolution(e.target.value)} style={styles.input}>
              {RESOLUTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {resolution === 'error_de_pesaje' && (
            <div>
              <label htmlFor="resolve-qty" style={styles.label}>Cantidad corregida ({line.unit})</label>
              <input id="resolve-qty" type="text" inputMode="decimal" placeholder="0.000" value={correctedQty} onChange={(e) => setCorrectedQty(e.target.value)} style={styles.input} />
            </div>
          )}

          <div>
            <label htmlFor="resolve-note" style={styles.label}>Nota / Explicación (obligatorio)</label>
            <textarea id="resolve-note" rows={2} maxLength={255} placeholder="Detalla la resolución pactada..." value={note} onChange={(e) => setNote(e.target.value)} style={{ ...styles.input, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} disabled={submitting} style={{ ...styles.secondary, flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontWeight: 600 }}>
              {submitting ? 'Guardando...' : 'Resolver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
