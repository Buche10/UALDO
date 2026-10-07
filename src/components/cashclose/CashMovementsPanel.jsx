import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, Ban } from 'lucide-react';
import { listMovements, voidMovement, CASH_MOVEMENT_KINDS, REQUIRED_COUNTERPARTY_KINDS } from '../../services/cashMovementsClient';
import { useCashMovementSubmit } from '../../hooks/useCashMovementSubmit';
import { formatUsd } from '../../services/money';

export default function CashMovementsPanel({ fecha, onMovementChanged }) {
  const [movements, setMovements] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [totals, setTotals] = useState({ gastos_diarios: 0, por_tipo: {} });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [movementToVoid, setMovementToVoid] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidSubmitting, setVoidSubmitting] = useState(false);
  const [voidError, setVoidError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  const [form, setForm] = useState({
    kind: 'pago_efectivo',
    counterparty: '',
    amount: '',
    note: ''
  });

  const loadData = useCallback(async (page = 1, append = false) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    const res = await listMovements(fecha, page);
    setLoading(false);
    setLoadingMore(false);

    if (res.ok) {
      const data = res.data?.data || [];
      setMovements(prev => append ? [...prev, ...data] : data);
      if (res.data?.meta) setMeta(res.data.meta);
      if (res.data?.totals) setTotals(res.data.totals);
    } else {
      setError(res.error || 'Error al cargar los movimientos.');
    }
  }, [fecha]);

  useEffect(() => {
    loadData(1, false);
  }, [loadData]);

  const { submitting, error: submitError, fieldErrors, submitMovement, initUuid } = useCashMovementSubmit({
    businessDate: fecha,
    onSuccess: ({ message }) => {
      setSuccessBanner(message);
      setShowAddModal(false);
      setForm({ kind: 'pago_efectivo', counterparty: '', amount: '', note: '' });
      loadData(1, false);
      if (onMovementChanged) onMovementChanged();
      setTimeout(() => setSuccessBanner(null), 3000);
    }
  });

  const handleOpenAdd = () => {
    initUuid();
    setSuccessBanner(null);
    setShowAddModal(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    await submitMovement(form);
  };

  const handleOpenVoid = (m) => {
    setMovementToVoid(m);
    setVoidReason('');
    setVoidError(null);
    setShowVoidModal(true);
  };

  const handleSubmitVoid = async (e) => {
    e.preventDefault();
    if (!movementToVoid) return;
    const trimmed = voidReason.trim();
    if (!trimmed) {
      setVoidError('El motivo de anulación es obligatorio.');
      return;
    }

    setVoidSubmitting(true);
    const res = await voidMovement(movementToVoid.id, trimmed);
    setVoidSubmitting(false);

    if (res.ok) {
      setShowVoidModal(false);
      setSuccessBanner('Movimiento anulado.');
      loadData(1, false);
      if (onMovementChanged) onMovementChanged();
      setTimeout(() => setSuccessBanner(null), 3000);
    } else {
      setVoidError(res.data?.message || res.error || 'Error al anular movimiento.');
    }
  };

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Movimientos de Caja</h4>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gastos diarios y depósitos del día</span>
        </div>
        <button type="button" onClick={handleOpenAdd} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}>
          <Plus size={14} />
          <span>Registrar movimiento</span>
        </button>
      </div>

      {successBanner && (
        <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--success-soft)', border: '1px solid var(--border-success)', color: 'var(--success)', fontSize: '12px' }}>
          {successBanner}
        </div>
      )}
      {error && <div role="alert" style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px' }}>{error}</div>}

      {loading && movements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>Cargando movimientos...</div>
      ) : movements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>No hay movimientos registrados para este día.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {movements.map(m => {
            const isVoided = Boolean(m.anulado);
            return (
              <div key={m.id} style={{ padding: '10px 12px', borderRadius: '12px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', opacity: isVoided ? 0.6 : 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, textDecoration: isVoided ? 'line-through' : 'none' }}>
                      {m.kind_label || m.kind}
                    </span>
                    {m.counterparty && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{`(${m.counterparty})`}</span>}
                    {isVoided && <span style={{ padding: '2px 6px', borderRadius: '9999px', fontSize: '10px', background: 'var(--error-soft)', color: 'var(--error)', border: '1px solid var(--border-error)' }}>Anulado</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {m.note && <span>{m.note} · </span>}
                    <span>Por: {m.created_by?.name || m.created_by || 'Sistema'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong style={{ fontSize: '13px', textDecoration: isVoided ? 'line-through' : 'none' }}>{formatUsd(m.amount)}</strong>
                  {!isVoided && (
                    <button type="button" onClick={() => handleOpenVoid(m)} aria-label="Anular" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                      <Ban size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {meta.current_page < meta.last_page && (
            <button type="button" onClick={() => loadData(meta.current_page + 1, true)} disabled={loadingMore} className="btn-secondary" style={{ padding: '8px', borderRadius: '9999px', fontSize: '12px', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)', cursor: 'pointer' }}>
              {loadingMore ? 'Cargando...' : 'Cargar más'}
            </button>
          )}

          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Gastos diarios:</span>
            <strong>{formatUsd(totals.gastos_diarios)}</strong>
          </div>
        </div>
      )}

      {showAddModal && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Registrar Movimiento</h4>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            {submitError && <div role="alert" style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px' }}>{submitError}</div>}
            <form onSubmit={handleSubmitAdd} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="cmp_kind" className="form-label" style={{ fontSize: '11px' }}>Tipo de movimiento</label>
                <select id="cmp_kind" className="form-input" value={form.kind} onChange={e => setForm(p => ({ ...p, kind: e.target.value }))}>
                  {CASH_MOVEMENT_KINDS.map(k => <option key={k} value={k}>{k.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="cmp_counterparty" className="form-label" style={{ fontSize: '11px' }}>
                  Contraparte {REQUIRED_COUNTERPARTY_KINDS.has(form.kind) ? '(obligatoria)' : '(opcional)'}
                </label>
                <input id="cmp_counterparty" type="text" className="form-input" maxLength={120} value={form.counterparty} onChange={e => setForm(p => ({ ...p, counterparty: e.target.value }))} placeholder="Proveedor o persona..." />
                {fieldErrors.counterparty && <span style={{ color: 'var(--error)', fontSize: '10px' }}>{fieldErrors.counterparty[0]}</span>}
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="cmp_amount" className="form-label" style={{ fontSize: '11px' }}>Monto (USD)</label>
                <input id="cmp_amount" type="text" className="form-input" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                {fieldErrors.amount && <span style={{ color: 'var(--error)', fontSize: '10px' }}>{fieldErrors.amount[0]}</span>}
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="cmp_note" className="form-label" style={{ fontSize: '11px' }}>Nota (opcional, máx 200)</label>
                <input id="cmp_note" type="text" className="form-input" maxLength={200} value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="Detalle del gasto..." />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}>Cancelar</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer' }}>Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVoidModal && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '380px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-error)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--error)' }}>Anular Movimiento</h4>
              <button type="button" onClick={() => setShowVoidModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-main)', margin: 0 }}>¿Confirmas que deseas anular este movimiento? Se recalculará el cierre del día.</p>
            {voidError && <div role="alert" style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px' }}>{voidError}</div>}
            <form onSubmit={handleSubmitVoid} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="cmp_void_reason" className="form-label" style={{ fontSize: '11px' }}>Motivo de anulación (máx 200)</label>
                <textarea id="cmp_void_reason" className="form-input" rows={2} maxLength={200} value={voidReason} onChange={e => setVoidReason(e.target.value)} placeholder="Indica por qué se anula..." style={{ resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowVoidModal(false)} className="btn-secondary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}>Cancelar</button>
                <button type="submit" disabled={voidSubmitting || !voidReason.trim()} className="btn-primary" style={{ flex: 1, padding: '8px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', background: 'var(--error)' }}>Confirmar Anulación</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
