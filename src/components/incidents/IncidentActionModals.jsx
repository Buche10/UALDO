import React, { useState } from 'react';
import { X } from 'lucide-react';
import { INCIDENT_CAUSES, INCIDENT_CAUSE_LABELS } from '../../services/incidentsClient';

export function ResolveModal({ isOpen, isComplaint, onClose, onConfirm, submitting = false }) {
  const [resolution, setResolution] = useState('');
  const [cause, setCause] = useState('servicio');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (resolution.trim().length < 5) {
      setError('La resolución debe tener al menos 5 caracteres.');
      return;
    }
    setError(null);
    onConfirm({ resolution: resolution.trim(), ...(isComplaint ? { cause } : {}) });
  };

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)', zIndex: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: 'var(--grad-surface)', borderRadius: '12px', border: '1px solid var(--border-glass)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--shadow-dialog)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', fontWeight: 600 }}>Marcar incidencia resuelta</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        {error && <div role="alert" style={{ fontSize: '12px', color: 'var(--error)', background: 'var(--error-soft)', padding: '6px 8px', borderRadius: '4px' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isComplaint && (
            <div>
              <label htmlFor="res-cause" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Causa de la queja</label>
              <select id="res-cause" value={cause} onChange={(e) => setCause(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }}>
                {INCIDENT_CAUSES.map((c) => <option key={c} value={c}>{INCIDENT_CAUSE_LABELS[c]}</option>)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="res-text" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Resolución aplicada</label>
            <textarea id="res-text" rows={3} placeholder="Explica cómo se resolvió..." value={resolution} onChange={(e) => setResolution(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px', resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button type="button" onClick={onClose} disabled={submitting} style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>Cancelar</button>
            <button type="submit" disabled={submitting || resolution.trim().length < 5} style={{ padding: '8px 14px', borderRadius: '6px', background: 'var(--success)', border: 'none', color: 'var(--on-primary)', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
              {submitting ? 'Guardando...' : 'Confirmar resolución'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DiscardModal({ isOpen, onClose, onConfirm, submitting = false }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('El motivo debe tener al menos 5 caracteres.');
      return;
    }
    setError(null);
    onConfirm(reason.trim());
  };

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)', zIndex: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'var(--grad-surface)', borderRadius: '12px', border: '1px solid var(--border-glass)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--shadow-dialog)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', fontWeight: 600 }}>Descartar incidencia</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        {error && <div role="alert" style={{ fontSize: '12px', color: 'var(--error)', background: 'var(--error-soft)', padding: '6px 8px', borderRadius: '4px' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label htmlFor="disc-reason" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Motivo del descarte</label>
            <textarea id="disc-reason" rows={3} placeholder="Explica por qué se descarta..." value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px', resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button type="button" onClick={onClose} disabled={submitting} style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>Cancelar</button>
            <button type="submit" disabled={submitting || reason.trim().length < 5} style={{ padding: '8px 14px', borderRadius: '6px', background: 'var(--error)', border: 'none', color: 'var(--on-primary)', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
              {submitting ? 'Descartando...' : 'Confirmar descarte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CommentModal({ isOpen, onClose, onConfirm, submitting = false }) {
  const [comment, setComment] = useState('');
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onConfirm(comment.trim());
  };

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)', zIndex: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'var(--grad-surface)', borderRadius: '12px', border: '1px solid var(--border-glass)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--shadow-dialog)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', fontWeight: 600 }}>Agregar comentario</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label htmlFor="comm-text" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Comentario</label>
            <textarea id="comm-text" rows={3} placeholder="Escribe un comentario..." value={comment} onChange={(e) => setComment(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px', resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>Cancelar</button>
            <button type="submit" disabled={submitting || !comment.trim()} style={{ padding: '8px 14px', borderRadius: '6px', background: 'var(--primary)', border: 'none', color: 'var(--on-primary)', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
              {submitting ? 'Guardando...' : 'Comentar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
