import React from 'react';
import { RefreshCw, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { usePaymentMappings } from '../../hooks/usePaymentMappings';
import { VALID_PAYMENT_BUCKETS, BUCKET_LABELS } from '../../services/cashConfigClient';
import { formatUsd } from '../../services/money';

export default function PaymentMappingsPanel() {
  const {
    mappings,
    loading,
    error,
    successBanner,
    submitting,
    selectedMapping,
    targetBucket,
    setTargetBucket,
    confirmStep,
    setConfirmStep,
    fetchMappings,
    handleAcceptSuggestion,
    openChangeModal,
    closeChangeModal,
    confirmAndSave,
    applyBucketAssignment
  } = usePaymentMappings();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Formas de Pago de RunFood</h4>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Asocia cada forma de RunFood a su cubeta del Libro diario
          </span>
        </div>
        <button
          type="button"
          onClick={fetchMappings}
          disabled={loading}
          aria-label="Actualizar formas de pago"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '9999px',
            border: '1px solid var(--border-glass)',
            background: 'var(--chip-bg)',
            color: 'var(--text-main)',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {successBanner && (
        <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--success-soft)', border: '1px solid var(--border-success)', color: 'var(--success)', fontSize: '12px' }}>
          {successBanner}
        </div>
      )}
      {error && (
        <div role="alert" style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px' }}>
          {error}
        </div>
      )}

      {loading && mappings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Cargando formas de pago...
        </div>
      ) : mappings.length === 0 ? (
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          No hay formas de pago registradas.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {mappings.map(m => {
            const isUnmapped = m.bucket === 'sin_mapear';
            const hasSuggestion = Boolean(m.suggested_bucket && !m.confirmado);

            return (
              <div
                key={m.id}
                className="glass-card"
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  border: isUnmapped ? '1px solid var(--border-warning)' : '1px solid var(--border-glass)',
                  background: isUnmapped ? 'var(--warning-soft)' : 'var(--bg-card)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>
                      #{m.runfood_forma_pago_id} {m.descripcion_runfood}
                    </span>
                    {m.es_efectivo && (
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '9999px', background: 'var(--surface-soft)', color: 'var(--text-muted)' }}>
                        Efectivo
                      </span>
                    )}
                    {m.es_tarjeta && (
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '9999px', background: 'var(--surface-soft)', color: 'var(--text-muted)' }}>
                        Tarjeta
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: isUnmapped ? 'var(--warning-soft)' : 'var(--surface-soft)',
                      color: isUnmapped ? 'var(--warning)' : 'var(--text-main)',
                      border: isUnmapped ? '1px solid var(--border-warning)' : '1px solid var(--border-glass)'
                    }}
                  >
                    {BUCKET_LABELS[m.bucket] || m.bucket}
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {m.ultimo_arqueo ? (
                    <span>Último arqueo: {formatUsd(m.ultimo_arqueo.monto)} ({m.ultimo_arqueo.business_date})</span>
                  ) : (
                    <span>Sin movimientos recientes</span>
                  )}
                </div>

                {hasSuggestion && (
                  <div style={{ padding: '6px 10px', borderRadius: '8px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ fontSize: '11px' }}>
                      <span style={{ color: 'var(--accent)' }}>Sugerido: {BUCKET_LABELS[m.suggested_bucket] || m.suggested_bucket}</span>
                      {m.suggested_note && <span style={{ color: 'var(--text-muted)' }}> ({m.suggested_note})</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAcceptSuggestion(m)}
                      disabled={submitting}
                      className="btn-primary"
                      style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Aceptar sugerencia
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                  <button
                    type="button"
                    onClick={() => openChangeModal(m)}
                    className="btn-secondary"
                    style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedMapping && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', border: confirmStep ? '1px solid var(--border-warning)' : '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                {confirmStep ? 'Confirmar cambio' : 'Asignar cubeta'}
              </h4>
              <button type="button" onClick={closeChangeModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              Forma: <strong>#{selectedMapping.runfood_forma_pago_id} {selectedMapping.descripcion_runfood}</strong>
            </p>

            {!confirmStep ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="pm_bucket_select" className="form-label" style={{ fontSize: '11px' }}>Selecciona cubeta de destino:</label>
                  <select id="pm_bucket_select" className="form-input" value={targetBucket} onChange={e => setTargetBucket(e.target.value)}>
                    {VALID_PAYMENT_BUCKETS.map(b => (
                      <option key={b} value={b}>{BUCKET_LABELS[b] || b}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button type="button" onClick={closeChangeModal} className="btn-secondary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}>Cancelar</button>
                  <button type="button" disabled={submitting} onClick={confirmAndSave} className="btn-primary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer' }}>Guardar</button>
                </div>
              </div>
            ) : confirmStep === 'ignore' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)' }}>
                  <ShieldAlert size={18} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Advertencia de Ignorar</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-main)', margin: 0 }}>
                  Esta forma de pago no se sumará en ningún cierre.
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button type="button" onClick={() => setConfirmStep(null)} className="btn-secondary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}>Atrás</button>
                  <button type="button" disabled={submitting} onClick={applyBucketAssignment} className="btn-primary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', background: 'var(--warning)' }}>Confirmar ignorar</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)' }}>
                  <AlertCircle size={18} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Reasignar forma confirmada</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-main)', margin: 0 }}>
                  Cambiar la cubeta de una forma ya confirmada afecta a los días abiertos.
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button type="button" onClick={() => setConfirmStep(null)} className="btn-secondary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}>Atrás</button>
                  <button type="button" disabled={submitting} onClick={applyBucketAssignment} className="btn-primary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer' }}>Confirmar cambio</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
