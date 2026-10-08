import React from 'react';
import { RefreshCw, Plus, History, X, Info } from 'lucide-react';
import { useCommissionRates } from '../../hooks/useCommissionRates';
import { bpToPercent } from '../../services/money';

export default function CommissionRatesPanel() {
  const {
    current,
    history,
    loading,
    error,
    successBanner,
    selectedCard,
    ratePercent,
    setRatePercent,
    retentionPercent,
    setRetentionPercent,
    effectiveFrom,
    setEffectiveFrom,
    confirmModal,
    setConfirmModal,
    fieldErrors,
    submitting,
    historyCard,
    fetchRates,
    openNewRateModal,
    closeNewRateModal,
    openHistoryModal,
    closeHistoryModal,
    proceedToConfirm,
    submitRate
  } = useCommissionRates();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Tasas de Comisión de Tarjetas</h4>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Comisiones y retenciones por tarjeta con vigencia
          </span>
        </div>
        <button
          type="button"
          onClick={fetchRates}
          disabled={loading}
          aria-label="Actualizar tasas"
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

      <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <Info size={14} color="var(--accent)" />
        <span>La retención se calcula sobre el bruto. Confírmalo con tu contador.</span>
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

      {loading && current.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Cargando tasas de comisión...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {current.map(card => {
            const hasRate = card.rate_bp !== null && card.rate_bp !== undefined;

            return (
              <div
                key={card.card_type}
                className="glass-card"
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  border: !hasRate ? '1px solid var(--border-warning)' : '1px solid var(--border-glass)',
                  background: !hasRate ? 'var(--warning-soft)' : 'var(--bg-card)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '13px' }}>{card.label}</strong>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: hasRate ? 'var(--success-soft)' : 'var(--warning-soft)',
                      color: hasRate ? 'var(--success)' : 'var(--warning)',
                      border: hasRate ? '1px solid var(--border-success)' : '1px solid var(--border-warning)'
                    }}
                  >
                    {hasRate ? bpToPercent(card.rate_bp) : 'Sin tasa: su neto queda pendiente'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Comisión: </span><strong>{bpToPercent(card.rate_bp)}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Retención: </span><strong>{bpToPercent(card.retention_bp)}</strong></div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {card.effective_from ? `Desde ${card.effective_from}` : 'Sin vigencia registrada'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '2px' }}>
                  <button
                    type="button"
                    onClick={() => openHistoryModal(card)}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}
                  >
                    <History size={12} />
                    <span>Historial</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openNewRateModal(card)}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Plus size={12} />
                    <span>Nueva tasa</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedCard && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                {confirmModal ? 'Confirmar Nueva Tasa' : `Nueva Tasa para ${selectedCard.label}`}
              </h4>
              <button type="button" onClick={closeNewRateModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
              Una tasa nueva no cambia los días anteriores a su vigencia, y los días abiertos se vuelven a evaluar.
            </p>

            {!confirmModal ? (
              <form id="new-rate-form" onSubmit={e => { e.preventDefault(); proceedToConfirm(); }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="cr_rate_input" className="form-label" style={{ fontSize: '11px' }}>Comisión % (0 a 30)</label>
                  <input id="cr_rate_input" type="text" className="form-input" placeholder="ej. 4,48" value={ratePercent} onChange={e => setRatePercent(e.target.value)} />
                  {fieldErrors.rate && <span style={{ color: 'var(--error)', fontSize: '10px' }}>{fieldErrors.rate}</span>}
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="cr_retention_input" className="form-label" style={{ fontSize: '11px' }}>Retención % (0 a 30)</label>
                  <input id="cr_retention_input" type="text" className="form-input" placeholder="ej. 2,00" value={retentionPercent} onChange={e => setRetentionPercent(e.target.value)} />
                  {fieldErrors.retention && <span style={{ color: 'var(--error)', fontSize: '10px' }}>{fieldErrors.retention}</span>}
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="cr_effective_input" className="form-label" style={{ fontSize: '11px' }}>Vigente desde (AAAA-MM-DD)</label>
                  <input id="cr_effective_input" type="date" className="form-input" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} />
                  {fieldErrors.effective_from && <span style={{ color: 'var(--error)', fontSize: '10px' }}>{fieldErrors.effective_from}</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button type="button" onClick={closeNewRateModal} className="btn-secondary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}>Cancelar</button>
                  <button type="button" onClick={proceedToConfirm} className="btn-primary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer' }}>Continuar</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)' }}>
                  ¿Confirmas guardar la tasa de <strong>{selectedCard.label}</strong> con comisión de <strong>{ratePercent} %</strong> y retención de <strong>{retentionPercent} %</strong> vigente desde el <strong>{effectiveFrom}</strong>?
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button type="button" onClick={() => setConfirmModal(false)} className="btn-secondary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}>Atrás</button>
                  <button type="button" disabled={submitting} onClick={submitRate} className="btn-primary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer' }}>Confirmar y guardar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {historyCard && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                Historial de {historyCard.label}
              </h4>
              <button type="button" onClick={closeHistoryModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
              {history.filter(h => h.card_type === historyCard.card_type).length === 0 ? (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>Sin vigencias registradas.</span>
              ) : (
                history
                  .filter(h => h.card_type === historyCard.card_type)
                  .map(h => (
                    <div key={h.id} style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span>Desde {h.effective_from}</span>
                      <span>Com: <strong>{bpToPercent(h.rate_bp)}</strong> | Ret: <strong>{bpToPercent(h.retention_bp)}</strong></span>
                    </div>
                  ))
              )}
            </div>

            <button type="button" onClick={closeHistoryModal} className="btn-secondary" style={{ padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)', marginTop: '4px' }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
