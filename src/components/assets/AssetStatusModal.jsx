import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ASSET_STATUSES, ASSET_STATUS_LABELS, setAssetStatus } from '../../services/assetsClient';

export default function AssetStatusModal({ asset, isOpen, onClose, onUpdated }) {
  const [status, setStatus] = useState(asset?.status || 'activo');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await setAssetStatus(asset.id, status, reason.trim());
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error || 'Error al cambiar el estado del activo.');
      return;
    }

    onUpdated?.(res.data);
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)', zIndex: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '380px', background: 'var(--grad-surface)', borderRadius: '14px', border: '1px solid var(--border-glass)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--shadow-dialog)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', fontWeight: 600 }}>
            Cambiar estado de activo
          </h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-main)' }}>
          Activo: <strong>{asset.name}</strong>
        </div>

        {error && <div role="alert" style={{ fontSize: '12px', color: 'var(--error)', background: 'var(--error-soft)', padding: '6px 10px', borderRadius: '6px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label htmlFor="status-select" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>Nuevo estado</label>
            <select id="status-select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }}>
              {ASSET_STATUSES.map((s) => <option key={s} value={s}>{ASSET_STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="status-reason" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>Motivo (opcional)</label>
            <textarea id="status-reason" rows={2} placeholder="Explica la razón del cambio..." value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px', resize: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button type="button" onClick={onClose} disabled={submitting} style={{ padding: '8px 14px', borderRadius: '6px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting} style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--primary)', border: 'none', color: 'var(--on-primary)', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
              {submitting ? 'Guardando...' : 'Actualizar estado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
