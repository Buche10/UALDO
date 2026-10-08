import React, { useState } from 'react';
import { Save, CheckCircle2, X, ShieldAlert } from 'lucide-react';
import { normalizeAmount } from '../../services/money';
import { useCashClose } from '../../hooks/useCashClose';

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
  const [forceReason, setForceReason] = useState('');
  const [showForceInput, setShowForceInput] = useState(false);

  const {
    error: generalError,
    setError: setGeneralError,
    submitting,
    fieldErrors,
    setFieldErrors,
    fallasModal,
    setFallasModal,
    submitReview
  } = useCashClose({ fecha: cierre.fecha, onUpdated, onReload });

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
    const { payload, error } = buildPayload(confirmar);
    if (error) {
      setGeneralError(error);
      return;
    }
    await submitReview(payload);
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

    const res = await submitReview(payload);
    if (res.ok) {
      setFallasModal(null);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Revisar y Cerrar Día</h4>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Solo modifica los campos necesarios</span>
      </div>

      {generalError && (
        <div role="alert" style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px' }}>
          {generalError}
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); handleSubmit(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { id: 'crf_efectivo_contado', key: 'efectivo_contado', label: 'Efectivo contado (USD)' },
            { id: 'crf_tarjeta_neto', key: 'tarjeta_neto', label: 'Tarjeta neto (USD)' },
            { id: 'crf_diners_neto', key: 'diners_neto', label: 'Diners neto (USD)' },
            { id: 'crf_pedidos_ya_neto', key: 'pedidos_ya_neto', label: 'Pedidos Ya neto (USD)' },
            { id: 'crf_pedidos_ya', key: 'pedidos_ya', label: 'Pedidos Ya bruto (USD)' },
            { id: 'crf_decoracion_efectivo', key: 'decoracion_efectivo', label: 'Decoración efectivo (USD)' },
            { id: 'crf_decoracion_tarjeta', key: 'decoracion_tarjeta', label: 'Decoración tarjeta (USD)' },
            { id: 'crf_decoracion_transferencia', key: 'decoracion_transferencia', label: 'Decoración transf. (USD)' }
          ].map(({ id, key, label }) => (
            <div key={key} className="form-group" style={{ margin: 0 }}>
              <label htmlFor={id} className="form-label" style={{ fontSize: '11px' }}>{label}</label>
              <input id={id} type="text" className="form-input" placeholder="0.00" value={form[key]} onChange={e => handleChange(key, e.target.value)} />
              {fieldErrors[key] && <span style={{ color: 'var(--error)', fontSize: '10px' }}>{fieldErrors[key][0]}</span>}
            </div>
          ))}
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="crf_observacion" className="form-label" style={{ fontSize: '11px' }}>Observación (opcional, máx 500)</label>
          <textarea id="crf_observacion" className="form-input" rows={2} maxLength={500} value={form.observacion} onChange={e => handleChange('observacion', e.target.value)} placeholder="Comentarios sobre el cierre..." style={{ resize: 'none' }} />
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
      </form>

      {fallasModal && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-warning)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', fontWeight: 600 }}>
                <ShieldAlert size={18} />
                <span>{fallasModal.message && fallasModal.message !== 'El cierre no cuadra' ? 'El cierre no cuadra' : 'Fallas de cuadre'}</span>
              </div>
              <button type="button" onClick={() => setFallasModal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              {fallasModal.message || 'Se guardaron los datos cargados, pero el cierre contiene fallas:'}
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Array.isArray(fallasModal.fallas) && fallasModal.fallas.map((f, i) => (
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
