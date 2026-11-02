import React, { useState, useEffect } from 'react';
import { Utensils, ArrowRight, RefreshCw } from 'lucide-react';
import { listInventory } from '../services/inventoryClient';
import { request } from '../services/apiClient';

export default function DobleFiloCard({ onNavigateToInventory }) {
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const fetchMotorData = async () => {
    setLoading(true);
    const [inventoryResult, summaryResult] = await Promise.all([
      listInventory({ page: 1 }),
      request('/restaurant/summary'),
    ]);
    setLoading(false);

    if (inventoryResult.ok && inventoryResult.data?.totals) {
      setTotals(inventoryResult.data.totals);
    } else {
      setTotals(null);
    }

    setSummary(summaryResult.ok && summaryResult.data ? summaryResult.data : null);
    setError(inventoryResult.ok && summaryResult.ok ? null : 'No se pudo consultar el resumen del motor.');
  };

  useEffect(() => {
    fetchMotorData();
  }, []);

  const hasTotals = totals !== null;

  return (
    <div className="glass-card" style={{ padding: '18px', border: '1px solid var(--border-glow)', background: 'var(--grad-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Utensils size={22} color="var(--on-primary)" aria-hidden="true" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              {summary?.business_name ? `Restaurante: ${summary.business_name}` : 'Restaurante Ualdo'}
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: 600 }}>
              Motor UaldoBusiness
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchMotorData}
          disabled={loading}
          className="glass-card-interactive"
          style={{ padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <RefreshCw size={12} className={loading ? 'spin' : ''} aria-hidden="true" />
          <span>Actualizar</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Total insumos</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            {hasTotals ? totals.count : 'Sin datos'}
          </div>
        </div>

        <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-card)', border: hasTotals && totals.low_stock_count > 0 ? '1px solid var(--warning)' : '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Stock bajo</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: hasTotals && totals.low_stock_count > 0 ? 'var(--warning)' : 'var(--success)', marginTop: '4px' }}>
            {hasTotals ? totals.low_stock_count : 'Sin datos'}
          </div>
        </div>
      </div>

      {error && (
        <div role="status" style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px', marginBottom: '12px' }}>
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onNavigateToInventory}
        className="btn-primary"
        style={{
          padding: '10px 14px',
          fontSize: '13px',
          fontWeight: 600,
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          cursor: 'pointer',
        }}
      >
        <span>Ver inventario</span>
        <ArrowRight size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
