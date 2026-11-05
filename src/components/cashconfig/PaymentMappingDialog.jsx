import React from 'react';
import { AlertCircle, X, ShieldAlert } from 'lucide-react';
import { VALID_PAYMENT_BUCKETS, BUCKET_LABELS } from '../../services/cashConfigClient';

const BTN_SECUNDARIO = { flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' };
const BTN_PRIMARIO = { flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer' };

function Confirmacion({ icono: Icono, titulo, texto, etiqueta, submitting, onBack, onConfirm, primarioExtra }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)' }}>
        <Icono size={18} />
        <span style={{ fontSize: '12px', fontWeight: 600 }}>{titulo}</span>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-main)', margin: 0 }}>{texto}</p>
      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
        <button type="button" onClick={onBack} className="btn-secondary" style={BTN_SECUNDARIO}>Atrás</button>
        <button type="button" disabled={submitting} onClick={onConfirm} className="btn-primary" style={{ ...BTN_PRIMARIO, ...primarioExtra }}>{etiqueta}</button>
      </div>
    </div>
  );
}

function SelectorDeCasilla({ targetBucket, setTargetBucket, submitting, onCancel, onSave }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="form-group" style={{ margin: 0 }}>
        <label htmlFor="pm_bucket_select" className="form-label" style={{ fontSize: '11px' }}>¿En qué casilla del cierre va?</label>
        <select id="pm_bucket_select" className="form-input" value={targetBucket} onChange={e => setTargetBucket(e.target.value)}>
          {VALID_PAYMENT_BUCKETS.map(b => (
            <option key={b} value={b}>{BUCKET_LABELS[b] || b}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
        <button type="button" onClick={onCancel} className="btn-secondary" style={BTN_SECUNDARIO}>Cancelar</button>
        <button type="button" disabled={submitting} onClick={onSave} className="btn-primary" style={BTN_PRIMARIO}>Guardar</button>
      </div>
    </div>
  );
}

/**
 * Diálogo para elegir la casilla del cierre de una forma de pago (Brief 43p),
 * con la confirmación de ignorar y la de cambiar una forma ya confirmada.
 */
export default function PaymentMappingDialog({
  mapping,
  targetBucket,
  setTargetBucket,
  confirmStep,
  setConfirmStep,
  submitting,
  onClose,
  onSave,
  onApply
}) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="pm_dialog_title" style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', border: confirmStep ? '1px solid var(--border-warning)' : '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h4 id="pm_dialog_title" style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
            {confirmStep ? 'Confirmar cambio' : 'Elegir casilla'}
          </h4>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
        </div>

        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
          Forma: <strong>#{mapping.runfood_forma_pago_id} {mapping.descripcion_runfood}</strong>
        </p>

        {!confirmStep && (
          <SelectorDeCasilla targetBucket={targetBucket} setTargetBucket={setTargetBucket} submitting={submitting} onCancel={onClose} onSave={onSave} />
        )}
        {confirmStep === 'ignore' && (
          <Confirmacion
            icono={ShieldAlert}
            titulo="Ignorar esta forma"
            texto="Esta forma de pago no se sumará en ningún cierre."
            etiqueta="Confirmar ignorar"
            submitting={submitting}
            onBack={() => setConfirmStep(null)}
            onConfirm={onApply}
            primarioExtra={{ background: 'var(--warning)' }}
          />
        )}
        {confirmStep === 'reassign' && (
          <Confirmacion
            icono={AlertCircle}
            titulo="Reasignar forma confirmada"
            texto="Cambiar la casilla de una forma ya confirmada afecta a los días abiertos."
            etiqueta="Confirmar cambio"
            submitting={submitting}
            onBack={() => setConfirmStep(null)}
            onConfirm={onApply}
          />
        )}
      </div>
    </div>
  );
}
