import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ASSET_CATEGORIES, ASSET_CATEGORY_LABELS, createAsset, updateAsset } from '../../services/assetsClient';

export default function AssetFormModal({ asset = null, isOpen, onClose, onSaved }) {
  const isEditing = Boolean(asset?.id);
  const [category, setCategory] = useState(asset?.category || 'vajilla');
  const [name, setName] = useState(asset?.name || '');
  const [code, setCode] = useState(asset?.code || '');
  const [expectedQuantity, setExpectedQuantity] = useState(asset?.expected_quantity !== undefined ? String(asset.expected_quantity) : '0');
  const [minQuantity, setMinQuantity] = useState(asset?.min_quantity !== null && asset?.min_quantity !== undefined ? String(asset.min_quantity) : '');
  const [notes, setNotes] = useState(asset?.notes || '');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const initialExpected = asset?.expected_quantity ?? 0;
  const isQtyChanged = isEditing && parseInt(expectedQuantity, 10) !== initialExpected;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const expQty = parseInt(expectedQuantity, 10);
    if (!Number.isInteger(expQty) || expQty < 0) {
      setError('La cantidad esperada debe ser un entero mayor o igual a 0.');
      return;
    }

    if (isQtyChanged && !reason.trim()) {
      setError('Debes indicar un motivo para cambiar la cantidad esperada.');
      return;
    }

    setSubmitting(true);
    let res;
    if (isEditing) {
      const payload = {
        name: name.trim(),
        code: code.trim() || null,
        expected_quantity: expQty,
        min_quantity: minQuantity.trim() !== '' ? parseInt(minQuantity, 10) : null,
        notes: notes.trim() || null,
      };
      res = await updateAsset(asset.id, payload, reason.trim());
    } else {
      res = await createAsset({
        category,
        name: name.trim(),
        code: code.trim() || null,
        expected_quantity: expQty,
        min_quantity: minQuantity.trim() !== '' ? parseInt(minQuantity, 10) : null,
        notes: notes.trim() || null,
      });
    }

    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || 'Error al guardar el activo.');
      return;
    }

    onSaved?.(res.data);
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)', zIndex: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--grad-surface)', borderRadius: '14px', border: '1px solid var(--border-glass)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--shadow-dialog)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', fontWeight: 600 }}>
            {isEditing ? 'Editar activo' : 'Nuevo activo'}
          </h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {error && <div role="alert" style={{ fontSize: '12px', color: 'var(--error)', background: 'var(--error-soft)', padding: '6px 10px', borderRadius: '6px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!isEditing && (
            <div>
              <label htmlFor="asset-cat" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>Categoría</label>
              <select id="asset-cat" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }}>
                {ASSET_CATEGORIES.map((c) => <option key={c} value={c}>{ASSET_CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="asset-name" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>Nombre</label>
            <input id="asset-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label htmlFor="asset-code" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>Código</label>
              <input id="asset-code" type="text" placeholder="Ej: VAJ-01" value={code} onChange={(e) => setCode(e.target.value)} maxLength={30} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }} />
            </div>
            <div>
              <label htmlFor="asset-exp" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>Cantidad esperada</label>
              <input id="asset-exp" type="number" min="0" value={expectedQuantity} onChange={(e) => setExpectedQuantity(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }} />
            </div>
          </div>

          <div>
            <label htmlFor="asset-min" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>Cantidad mínima (opcional)</label>
            <input id="asset-min" type="number" min="0" placeholder="Ej: 10" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }} />
          </div>

          {isQtyChanged && (
            <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'var(--surface-soft)', border: '1px solid var(--border-warning)' }}>
              <label htmlFor="asset-reason" style={{ display: 'block', fontSize: '12px', color: 'var(--warning)', fontWeight: 600, marginBottom: '3px' }}>
                Motivo del cambio de cantidad esperada (obligatorio)
              </label>
              <input id="asset-reason" type="text" placeholder="Ej: Compra adicional, ajuste por donación..." value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }} />
            </div>
          )}

          <div>
            <label htmlFor="asset-notes" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>Observaciones (opcional)</label>
            <textarea id="asset-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px', resize: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button type="button" onClick={onClose} disabled={submitting} style={{ padding: '8px 14px', borderRadius: '6px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting} style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--primary)', border: 'none', color: 'var(--on-primary)', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
              {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear activo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
