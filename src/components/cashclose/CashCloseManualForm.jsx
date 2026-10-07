import React, { useState, useMemo } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { createManualClose } from '../../services/cashCloseClient';
import { normalizeAmount } from '../../services/money';

export default function CashCloseManualForm({ initialFecha, onCancel, onSuccess, onSwitchToDetail }) {
  const { minDate, maxDate } = useMemo(() => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 90);
    return {
      minDate: past.toISOString().slice(0, 10),
      maxDate: today.toISOString().slice(0, 10)
    };
  }, []);

  const [fecha, setFecha] = useState(initialFecha || maxDate);
  const [form, setForm] = useState({
    efectivo: '',
    pichincha: '',
    de_una: '',
    internacional: '',
    credito: '',
    debito: '',
    diners: '',
    pedidos_ya: '',
    decoracion_efectivo: '',
    decoracion_tarjeta: '',
    decoracion_transferencia: '',
    propinas: '',
    observacion: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [conflictMessage, setConflictMessage] = useState(null);

  const handleChange = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setConflictMessage(null);

    const payload = { fecha };
    const moneyFields = [
      'efectivo', 'pichincha', 'de_una', 'internacional', 'credito',
      'debito', 'diners', 'pedidos_ya', 'decoracion_efectivo',
      'decoracion_tarjeta', 'decoracion_transferencia', 'propinas'
    ];

    for (const field of moneyFields) {
      const val = form[field].trim();
      if (val !== '') {
        const norm = normalizeAmount(val);
        if (norm === null) {
          setError(`Monto inválido para ${field.replace('_', ' ')}`);
          return;
        }
        payload[field] = norm;
      }
    }

    if (form.observacion.trim()) {
      payload.observacion = form.observacion.trim();
    }

    setSubmitting(true);
    const res = await createManualClose(payload);
    setSubmitting(false);

    if (res.ok) {
      if (onSuccess) onSuccess(res.data?.data || res.data);
      return;
    }

    if (res.status === 409) {
      const msg = res.data?.message || 'Este cierre lo genera RunFood: usa la revisión del cierre.';
      setConflictMessage(msg);
      return;
    }

    setError(res.data?.message || res.error || 'Error al crear el cierre manual.');
  };

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onCancel && (
            <button type="button" onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={16} />
            </button>
          )}
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Cargar Cierre a Mano</h4>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Día sin datos de RunFood</span>
      </div>

      {error && (
        <div role="alert" style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px' }}>
          {error}
        </div>
      )}

      {conflictMessage && (
        <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--warning-soft)', border: '1px solid var(--border-warning)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--warning)' }}>{conflictMessage}</p>
          {onSwitchToDetail && (
            <button type="button" onClick={() => onSwitchToDetail(fecha)} className="btn-primary" style={{ padding: '8px 14px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', alignSelf: 'flex-start' }}>
              Ver cierre de RunFood
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="ccm_fecha" className="form-label" style={{ fontSize: '11px' }}>Fecha de negocio</label>
          <input id="ccm_fecha" type="date" className="form-input" min={minDate} max={maxDate} value={fecha} onChange={e => setFecha(e.target.value)} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="ccm_efectivo" className="form-label" style={{ fontSize: '11px' }}>Efectivo</label>
            <input id="ccm_efectivo" type="text" className="form-input" placeholder="0.00" value={form.efectivo} onChange={e => handleChange('efectivo', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="ccm_pichincha" className="form-label" style={{ fontSize: '11px' }}>Pichincha</label>
            <input id="ccm_pichincha" type="text" className="form-input" placeholder="0.00" value={form.pichincha} onChange={e => handleChange('pichincha', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="ccm_de_una" className="form-label" style={{ fontSize: '11px' }}>De Una</label>
            <input id="ccm_de_una" type="text" className="form-input" placeholder="0.00" value={form.de_una} onChange={e => handleChange('de_una', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="ccm_internacional" className="form-label" style={{ fontSize: '11px' }}>Internacional</label>
            <input id="ccm_internacional" type="text" className="form-input" placeholder="0.00" value={form.internacional} onChange={e => handleChange('internacional', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="ccm_credito" className="form-label" style={{ fontSize: '11px' }}>Crédito</label>
            <input id="ccm_credito" type="text" className="form-input" placeholder="0.00" value={form.credito} onChange={e => handleChange('credito', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="ccm_debito" className="form-label" style={{ fontSize: '11px' }}>Débito</label>
            <input id="ccm_debito" type="text" className="form-input" placeholder="0.00" value={form.debito} onChange={e => handleChange('debito', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="ccm_diners" className="form-label" style={{ fontSize: '11px' }}>Diners</label>
            <input id="ccm_diners" type="text" className="form-input" placeholder="0.00" value={form.diners} onChange={e => handleChange('diners', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="ccm_pedidos_ya" className="form-label" style={{ fontSize: '11px' }}>Pedidos Ya</label>
            <input id="ccm_pedidos_ya" type="text" className="form-input" placeholder="0.00" value={form.pedidos_ya} onChange={e => handleChange('pedidos_ya', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="ccm_decoracion_efectivo" className="form-label" style={{ fontSize: '11px' }}>Decoración efectivo</label>
            <input id="ccm_decoracion_efectivo" type="text" className="form-input" placeholder="0.00" value={form.decoracion_efectivo} onChange={e => handleChange('decoracion_efectivo', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="ccm_decoracion_tarjeta" className="form-label" style={{ fontSize: '11px' }}>Decoración tarjeta</label>
            <input id="ccm_decoracion_tarjeta" type="text" className="form-input" placeholder="0.00" value={form.decoracion_tarjeta} onChange={e => handleChange('decoracion_tarjeta', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="ccm_decoracion_transferencia" className="form-label" style={{ fontSize: '11px' }}>Decoración transf.</label>
            <input id="ccm_decoracion_transferencia" type="text" className="form-input" placeholder="0.00" value={form.decoracion_transferencia} onChange={e => handleChange('decoracion_transferencia', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="ccm_propinas" className="form-label" style={{ fontSize: '11px' }}>Propinas</label>
            <input id="ccm_propinas" type="text" className="form-input" placeholder="0.00" value={form.propinas} onChange={e => handleChange('propinas', e.target.value)} />
          </div>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="ccm_observacion" className="form-label" style={{ fontSize: '11px' }}>Observación (opcional)</label>
          <textarea id="ccm_observacion" className="form-input" rows={2} maxLength={500} value={form.observacion} onChange={e => handleChange('observacion', e.target.value)} style={{ resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}>
              Cancelar
            </button>
          )}
          <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Save size={14} />
            <span>Guardar Cierre</span>
          </button>
        </div>
      </form>
    </div>
  );
}
