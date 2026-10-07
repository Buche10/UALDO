import React, { useState } from 'react';
import { CreditCard, Unlock, X, AlertTriangle } from 'lucide-react';
import { setNetosReales, reopenClose } from '../../services/cashCloseClient';
import { normalizeAmount } from '../../services/money';

export default function CashCloseClosedActions({ cierre, onUpdated }) {
  const [showNetosModal, setShowNetosModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);

  const [netosForm, setNetosForm] = useState({
    tarjeta_neto: cierre.tarjeta_neto != null ? String(cierre.tarjeta_neto) : '',
    diners_neto: cierre.diners_neto != null ? String(cierre.diners_neto) : '',
    pedidos_ya_neto: cierre.pedidos_ya_neto != null ? String(cierre.pedidos_ya_neto) : ''
  });
  const [reopenMotivo, setReopenMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleNetosSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = {};
    let hasOne = false;

    for (const key of ['tarjeta_neto', 'diners_neto', 'pedidos_ya_neto']) {
      const val = netosForm[key].trim();
      if (val !== '') {
        const norm = normalizeAmount(val);
        if (norm === null) {
          setError(`Monto inválido para ${key.replace('_', ' ')}`);
          return;
        }
        payload[key] = norm;
        hasOne = true;
      }
    }

    if (!hasOne) {
      setError('Debes ingresar al menos un valor de neto real.');
      return;
    }

    setSubmitting(true);
    const res = await setNetosReales(cierre.fecha, payload);
    setSubmitting(false);

    if (res.ok) {
      setShowNetosModal(false);
      onUpdated(res.data?.data || res.data);
    } else {
      setError(res.data?.message || res.error || 'Error al guardar netos reales.');
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const trimmed = reopenMotivo.trim();
    if (!trimmed) {
      setError('El motivo de reapertura es obligatorio.');
      return;
    }
    if (trimmed.length > 300) {
      setError('El motivo no debe superar 300 caracteres.');
      return;
    }

    setSubmitting(true);
    const res = await reopenClose(cierre.fecha, trimmed);
    setSubmitting(false);

    if (res.ok) {
      setShowReopenModal(false);
      onUpdated(res.data?.data || res.data);
    } else {
      setError(res.data?.message || res.error || 'Error al reabrir el día.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => { setError(null); setShowNetosModal(true); }}
          className="btn-secondary"
          style={{ flex: 1, padding: '10px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <CreditCard size={14} />
          <span>Cargar netos del banco</span>
        </button>

        <button
          type="button"
          onClick={() => { setError(null); setShowReopenModal(true); }}
          className="btn-secondary"
          style={{ flex: 1, padding: '10px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-warning)', background: 'var(--warning-soft)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Unlock size={14} />
          <span>Reabrir el día</span>
        </button>
      </div>

      {showNetosModal && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '380px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Cargar Netos Reales</h4>
              <button type="button" onClick={() => setShowNetosModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Ingresa los netos acreditados por los bancos. Se reexportará el día sin cambiar el estado cerrado.
            </p>
            {error && <div role="alert" style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px' }}>{error}</div>}
            <form onSubmit={handleNetosSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="cca_tarjeta_neto" className="form-label" style={{ fontSize: '11px' }}>Tarjeta neto</label>
                <input id="cca_tarjeta_neto" type="text" className="form-input" placeholder="0.00" value={netosForm.tarjeta_neto} onChange={e => setNetosForm(p => ({ ...p, tarjeta_neto: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="cca_diners_neto" className="form-label" style={{ fontSize: '11px' }}>Diners neto</label>
                <input id="cca_diners_neto" type="text" className="form-input" placeholder="0.00" value={netosForm.diners_neto} onChange={e => setNetosForm(p => ({ ...p, diners_neto: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="cca_pedidos_ya_neto" className="form-label" style={{ fontSize: '11px' }}>Pedidos Ya neto</label>
                <input id="cca_pedidos_ya_neto" type="text" className="form-input" placeholder="0.00" value={netosForm.pedidos_ya_neto} onChange={e => setNetosForm(p => ({ ...p, pedidos_ya_neto: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowNetosModal(false)} className="btn-secondary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}>Cancelar</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer' }}>Guardar Netos</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReopenModal && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '380px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-warning)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning)', fontWeight: 600 }}>
                <AlertTriangle size={18} />
                <span>Reabrir el día</span>
              </div>
              <button type="button" onClick={() => setShowReopenModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>
              El día volverá a revisión y no se cerrará solo. Requiere confirmación posterior del dueño.
            </p>
            {error && <div role="alert" style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px' }}>{error}</div>}
            <form onSubmit={handleReopenSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="cca_motivo" className="form-label" style={{ fontSize: '11px' }}>Motivo de reapertura (máx 300)</label>
                <textarea id="cca_motivo" className="form-input" rows={3} maxLength={300} value={reopenMotivo} onChange={e => setReopenMotivo(e.target.value)} placeholder="Indica el motivo..." style={{ resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowReopenModal(false)} className="btn-secondary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}>Cancelar</button>
                <button type="submit" disabled={submitting || !reopenMotivo.trim()} className="btn-primary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer' }}>Reabrir Cierre</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
