import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, AlertCircle, Sparkles } from 'lucide-react';
import { listOtherPurchases } from '../../../services/purchasesClient';
import { money, styles } from './purchaseUi';

export default function OtherPurchasesPanel() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);

  const loadData = useCallback(async (targetPage = 1, append = false) => {
    setLoading(true);
    setError(null);
    const res = await listOtherPurchases({ from, to, page: targetPage });
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'No se pudieron cargar las otras compras.');
      return;
    }
    const items = res.data?.data || [];
    setData((prev) => (append ? [...prev, ...items] : items));
    setMeta(res.data?.meta || {});
    setPage(targetPage);
  }, [from, to]);

  useEffect(() => {
    loadData(1, false);
  }, [loadData]);

  const candidates = meta.catalog_candidates || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
          Otras compras (fuera de catálogo)
        </h3>
      </div>

      <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <Calendar size={14} color="var(--accent)" />
          <span>Filtrar por período</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label htmlFor="other-from" style={styles.label}>Desde</label>
            <input id="other-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={styles.input} />
          </div>
          <div>
            <label htmlFor="other-to" style={styles.label}>Hasta</label>
            <input id="other-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} style={styles.input} />
          </div>
        </div>
      </div>

      <div style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
          Total acumulado
        </span>
        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>
          {money(meta.total)}
        </span>
      </div>

      {/* Sección candidatos al catálogo */}
      <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid var(--accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="var(--accent)" />
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
            Se repite: candidatos al catálogo
          </h4>
        </div>
        {candidates.length === 0 ? (
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
            No hay compras repetidas suficientes en este período para sugerir candidatos.
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {candidates.map((cand, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  background: 'var(--surface-soft)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-main)',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {typeof cand === 'string' ? cand : cand.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div role="alert" style={{ ...styles.errorBox, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {loading && data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando otras compras...
        </div>
      ) : data.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '24px' }}>
          No se registraron otras compras en el período seleccionado.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.map((item) => (
            <div key={item.id} style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
                    {item.name}
                  </span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {item.purchased_on} &bull; {item.supplier?.name || item.supplier_name || 'Proveedor'}
                    {item.created_by?.name ? ` &bull; Registrado por ${item.created_by.name}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>
                    {money(item.line_total)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {item.quantity} {item.unit || 'unidad'}
                  </div>
                </div>
              </div>
              {item.note && (
                <div style={{ fontSize: '11px', color: 'var(--text-subtle)', background: 'var(--surface-soft)', padding: '4px 8px', borderRadius: '6px' }}>
                  <strong>Motivo:</strong> {item.note}
                </div>
              )}
            </div>
          ))}

          {meta.current_page < meta.last_page && (
            <button
              type="button"
              onClick={() => loadData(page + 1, true)}
              disabled={loading}
              className="btn-secondary"
              style={{
                alignSelf: 'center',
                padding: '8px 18px',
                borderRadius: '9999px',
                border: '1px solid var(--border-glass)',
                background: 'var(--surface-soft)',
                color: 'var(--text-main)',
                fontSize: '12px',
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              {loading ? 'Cargando...' : 'Cargar más'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
