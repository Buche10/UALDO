import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getReconciliation } from '../../../services/purchasesClient';
import { todayIso } from '../../../hooks/usePurchaseForm';
import { styles } from './purchaseUi';

export default function ReconciliationPanel() {
  const [date, setDate] = useState(todayIso());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({});

  const loadReconciliation = useCallback(async (selectedDate) => {
    if (!selectedDate) return;
    setLoading(true);
    setError(null);
    const res = await getReconciliation(selectedDate);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'No se pudo cargar la conciliación.');
      return;
    }
    setRows(res.data?.data || []);
    setMeta(res.data?.meta || {});
  }, []);

  useEffect(() => {
    loadReconciliation(date);
  }, [date, loadReconciliation]);

  const alertsCount = meta.alerts_count || rows.filter((r) => r.alerta).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
          Conciliación diaria
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} color="var(--accent)" />
          <input
            id="reconciliation-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ ...styles.input, padding: '4px 8px', fontSize: '12px', width: 'auto' }}
          />
        </div>
      </div>

      <div style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {rows.length} {rows.length === 1 ? 'insumo evaluado' : 'insumos evaluados'}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: alertsCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
          {alertsCount > 0 ? `${alertsCount} con diferencia` : 'Todo coincide'}
        </span>
      </div>

      {error && (
        <div role="alert" style={{ ...styles.errorBox, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando conciliación...
        </div>
      ) : rows.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '24px' }}>
          No hay actividad registrada para conciliar en esta fecha.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {rows.map((row) => (
            <div
              key={row.item_id}
              style={{
                ...styles.card,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                border: row.alerta ? '1px solid var(--warning)' : '1px solid var(--border-glass)',
                background: row.alerta ? 'var(--warning-soft)' : 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
                  {row.item_name}
                </span>
                {row.alerta ? (
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', background: 'var(--warning)', color: 'var(--on-primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={11} />
                    <span>Diferencia</span>
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', background: 'var(--surface-soft)', color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={11} />
                    <span>Coincide</span>
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', fontSize: '11px' }}>
                <div style={{ background: 'var(--surface-soft)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Pedido</div>
                  <strong style={{ color: 'var(--text-main)' }}>{row.pedido} {row.unit}</strong>
                </div>
                <div style={{ background: 'var(--surface-soft)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Comprado</div>
                  <strong style={{ color: 'var(--text-main)' }}>{row.comprado} {row.unit}</strong>
                </div>
                <div style={{ background: 'var(--surface-soft)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Facturado</div>
                  <strong style={{ color: 'var(--text-main)' }}>{row.facturado} {row.unit}</strong>
                </div>
                <div style={{ background: 'var(--surface-soft)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Recibido</div>
                  <strong style={{ color: 'var(--text-main)' }}>{row.recibido} {row.unit}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
