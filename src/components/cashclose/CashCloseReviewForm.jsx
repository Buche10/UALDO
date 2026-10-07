import React, { useState } from 'react';
import { Save, CheckCircle2, X, ShieldAlert } from 'lucide-react';
import { reviewClose } from '../../services/cashCloseClient';
import { normalizeAmount } from '../../services/money';

export default function CashCloseReviewForm({ cierre, onUpdated, onReload }) {
  const initialValues = {
    efectivo_contado: cierre.efectivo_contado != null ? String(cierre.efectivo_contado) : '',
    tarjeta_neto: cierre.tarjeta_neto != null ? String(cierre.tarjeta_neto) : '',
    diners_neto: cierre.diners_neto != null ? String(cierre.diners_neto) : '',
    pedidos_ya_neto: cierre.pedidos_ya_neto != null ? String(cierre.pedidos_ya_neto) : '',
    pedidos_ya: cierre.pedidos_ya != null ? String(cierre.pedidos_ya) : '',
    decoracion_efectivo: cierre.decoracion_efectivo != null ? String(cierre.decoracion_efectivo) : '',
    decoracion_tarjeta: cierre.decoracion_tarjeta != null ? String(cierre.decoracion_tarjeta) : '',
    decoracion_transferencia: cierre.decoracion_transferencia != null ? String(cierre.decoracion_transferencia) : '',
    observacion: cierre.observacion || ''
  };

  const [form, setForm] = useState(initialValues);
  const [dirty, setDirty] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [fallasModal, setFallasModal] = useState(null);
  const [forceReason, setForceReason] = useState('');
  const [showForceInput, setShowForceInput] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setDirty(prev => ({ ...prev, [field]: true }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const buildPayload = (confirmar = false) => {
    const payload = {};
    const moneyFields = [
      'efectivo_contado', 'tarjeta_neto', 'diners_neto', 'pedidos_ya_neto',
      'pedidos_ya', 'decoracion_efectivo', 'decoracion_tarjeta', 'decoracion_transferencia'
    ];

    for (const key of Object.keys(dirty)) {
      if (!dirty[key]) continue;
      if (moneyFields.includes(key)) {
        const val = form[key].trim();
        if (val === '') {
          payload[key] = null;
        } else {
          const norm = normalizeAmount(val);
          if (norm === null) {
            return { error: `Monto inválido en ${key.replace('_', ' ')}` };
          }
          payload[key] = norm;
        }
      } else if (key === 'observacion') {
        payload.observacion = form.observacion.trim();
      }
    }

    if (confirmar) payload.confirmar = true;
    return { payload };
  };

  const handleSubmit = async (confirmar = false) => {
    setGeneralError(null);
    setFieldErrors({});
    const { payload, error } = buildPayload(confirmar);
    if (error) {
      setGeneralError(error);
      return;
    }

    setSubmitting(true);
    const res = await reviewClose(cierre.fecha, payload);
    setSubmitting(false);

    if (res.ok) {
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('ualdo:notifications-updated'));
      }
      onUpdated(res.data?.data || res.data);
      return;
    }

    if (res.status === 422) {
      if (res.data?.fallas) {
        setFallasModal({ fallas: res.data.fallas, message: res.data.message });
        if (onReload) onReload();
        return;
      }
      if (res.data?.errors) setFieldErrors(res.data.errors);
      setGeneralError(res.data?.message || res.error || 'Datos no válidos.');
      return;
    }

    setGeneralError(res.error || 'Error al guardar el cierre.');
  };

  const handleForceClose = async () => {
    const trimmed = forceReason.trim();
    if (trimmed.length < 10 || trimmed.length > 300) {
      setGeneralError('El motivo debe tener entre 10 y 300 caracteres.');
      return;
    }

    const { payload } = buildPayload(true);
    payload.confirmar = true;
    payload.forzar = true;
    payload.motivo = trimmed;

    setSubmitting(true);
    const res = await reviewClose(cierre.fecha, payload);
    setSubmitting(false);

    if (res.ok) {
      setFallasModal(null);
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('ualdo:notifications-updated'));
      }
      onUpdated(res.data?.data || res.data);
    } else {
      setGeneralError(res.data?.message || res.error || 'No se pudo forzar el cierre.');
    }
  };

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Revisar y Cerrar Día</h4>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Solo campos modificados se envían</span>
      </div>

      {generalError && (
        <div role="alert" style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px' }}>
          {generalError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="cc_efectivo_contado" className="form-label" style={{ fontSize: '11px' }}>Efectivo contado</label>
          <input id="cc_efectivo_contado" type="text" className="form-input" placeholder="0.00" value={form.efectivo_contado} onChange={e => handleChange('efectivo_contado', e.target.value)} />
          {fieldErrors.efectivo_contado && <span style={{ color: 'var(--error)', fontSize: '10px' }}>{fieldErrors.efectivo_contado[0]}</span>}
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="cc_tarjeta_neto" className="form-label" style={{ fontSize: '11px' }}>Tarjeta neto</label>
          <input id="cc_tarjeta_neto" type="text" className="form-input" placeholder="0.00" value={form.tarjeta_neto} onChange={e => handleChange('tarjeta_neto', e.target.value)} />
          {fieldErrors.tarjeta_neto && <span style={{ color: 'var(--error)', fontSize: '10px' }}>{fieldErrors.tarjeta_neto[0]}</span>}
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="cc_diners_neto" className="form-label" style={{ fontSize: '11px' }}>Diners neto</label>
          <input id="cc_diners_neto" type="text" className="form-input" placeholder="0.00" value={form.diners_neto} onChange={e => handleChange('diners_neto', e.target.value)} />
          {fieldErrors.diners_neto && <span style={{ color: 'var(--error)', fontSize: '10px' }}>{fieldErrors.diners_neto[0]}</span>}
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="cc_pedidos_ya_neto" className="form-label" style={{ fontSize: '11px' }}>Pedidos Ya neto</label>
          <input id="cc_pedidos_ya_neto" type="text" className="form-input" placeholder="0.00" value={form.pedidos_ya_neto} onChange={e => handleChange('pedidos_ya_neto', e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="cc_pedidos_ya" className="form-label" style={{ fontSize: '11px' }}>Pedidos Ya bruto</label>
          <input id="cc_pedidos_ya" type="text" className="form-input" placeholder="0.00" value={form.pedidos_ya} onChange={e => handleChange('pedidos_ya', e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="cc_decoracion_efectivo" className="form-label" style={{ fontSize: '11px' }}>Decoración efectivo</label>
          <input id="cc_decoracion_efectivo" type="text" className="form-input" placeholder="0.00" value={form.decoracion_efectivo} onChange={e => handleChange('decoracion_efectivo', e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="cc_decoracion_tarjeta" className="form-label" style={{ fontSize: '11px' }}>Decoración tarjeta</label>
          <input id="cc_decoracion_tarjeta" type="text" className="form-input" placeholder="0.00" value={form.decoracion_tarjeta} onChange={e => handleChange('decoracion_tarjeta', e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="cc_decoracion_transferencia" className="form-label" style={{ fontSize: '11px' }}>Decoración transf.</label>
          <input id="cc_decoracion_transferencia" type="text" className="form-input" placeholder="0.00" value={form.decoracion_transferencia} onChange={e => handleChange('decoracion_transferencia', e.target.value)} />
        </div>
      </div>

      <div className="form-group" style={{ margin: 0 }}>
        <label htmlFor="cc_observacion" className="form-label" style={{ fontSize: '11px' }}>Observación (máx 500)</label>
        <textarea id="cc_observacion" className="form-input" rows={2} maxLength={500} value={form.observacion} onChange={e => handleChange('observacion', e.target.value)} style={{ resize: 'vertical' }} />
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => handleSubmit(false)} disabled={submitting} className="btn-secondary" style={{ flex: 1, padding: '10px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Save size={14} />
          <span>Guardar</span>
        </button>
        <button type="button" onClick={() => handleSubmit(true)} disabled={submitting} className="btn-primary" style={{ flex: 1, padding: '10px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} />
          <span>Guardar y cerrar el día</span>
        </button>
      </div>

      {fallasModal && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-warning)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', fontWeight: 600 }}>
                <ShieldAlert size={18} />
                <span>El cierre no cuadra</span>
              </div>
              <button type="button" onClick={() => setFallasModal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Se guardaron los datos cargados, pero el cierre contiene fallas:
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {fallasModal.fallas.map((f, i) => (
                <li key={i} style={{ color: 'var(--text-main)' }}>{f.motivo || f.detalle || f.tipo}</li>
              ))}
            </ul>
            {!showForceInput ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setFallasModal(null)} className="btn-secondary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}>Revisar datos</button>
                <button type="button" onClick={() => setShowForceInput(true)} className="btn-primary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer' }}>Cerrar de todas formas</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Motivo obligatorio ({forceReason.trim().length}/300 carácteres, mín. 10):
                </label>
                <textarea className="form-input" rows={3} value={forceReason} onChange={e => setForceReason(e.target.value)} placeholder="Explica por qué se fuerza el cierre..." maxLength={300} style={{ resize: 'none' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setShowForceInput(false)} className="btn-secondary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}>Cancelar</button>
                  <button type="button" onClick={handleForceClose} disabled={submitting || forceReason.trim().length < 10} className="btn-primary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer' }}>Confirmar y Forzar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
