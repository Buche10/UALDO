import React, { useState, useEffect } from 'react';
import { Package, Utensils, ArrowRight, RefreshCw } from 'lucide-react';
import { getDoblefiloTables } from '../services/doblefiloEngine';
import { listInventory } from '../services/inventoryClient';
import { request } from '../services/apiClient';

export default function DobleFiloCard({ onNavigateToInventory }) {
  const [activeSource, setActiveSource] = useState('inventory'); // 'inventory' | 'waiter'
  const [loading, setLoading] = useState(false);

  // Motor inventory totals
  const [inventoryTotals, setInventoryTotals] = useState({ count: 0, low_stock_count: 0 });
  const [realSummary, setRealSummary] = useState(null);

  // Waiter Orders State (Read Only)
  const [tablesData, setTablesData] = useState(null);

  const fetchMotorData = async () => {
    setLoading(true);
    const [invRes, sumRes] = await Promise.all([
      listInventory({ page: 1 }),
      request('/restaurant/summary'),
    ]);
    setLoading(false);

    if (invRes.ok && invRes.data) {
      setInventoryTotals(invRes.data.totals || { count: 0, low_stock_count: 0 });
    }
    if (sumRes.ok && sumRes.data) {
      setRealSummary(sumRes.data);
    }
  };

  const handleFetchTables = async () => {
    setLoading(true);
    const resTables = await getDoblefiloTables();
    setTablesData(resTables);
    setLoading(false);
  };

  useEffect(() => {
    fetchMotorData();
  }, []);

  return (
    <div className="glass-card" style={{ padding: '18px', border: '1px solid var(--border-glow)', background: 'linear-gradient(135deg, rgba(0, 115, 127, 0.14) 0%, rgba(29, 29, 27, 0.9) 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Utensils size={22} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              {realSummary ? `Restaurante: ${realSummary.business_name}` : 'Restaurante Ualdo'}
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
          style={{ padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-main)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px', marginBottom: '14px', border: '1px solid var(--border-glass)' }}>
        <button
          type="button"
          onClick={() => setActiveSource('inventory')}
          style={{
            flex: 1,
            padding: '7px 4px',
            borderRadius: '8px',
            border: 'none',
            background: activeSource === 'inventory' ? 'var(--primary)' : 'transparent',
            color: activeSource === 'inventory' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <Package size={13} />
          <span>Inventario</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveSource('waiter'); if (!tablesData) handleFetchTables(); }}
          style={{
            flex: 1,
            padding: '7px 4px',
            borderRadius: '8px',
            border: 'none',
            background: activeSource === 'waiter' ? 'var(--primary)' : 'transparent',
            color: activeSource === 'waiter' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <Utensils size={13} />
          <span>Mesas</span>
        </button>
      </div>

      {/* Tab: Resumen de Inventario del motor */}
      {activeSource === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(32, 45, 47, 0.6)', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Insumos</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                {inventoryTotals.count}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(32, 45, 47, 0.6)', border: inventoryTotals.low_stock_count > 0 ? '1px solid var(--warning)' : '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Stock Bajo</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: inventoryTotals.low_stock_count > 0 ? 'var(--warning)' : 'var(--success)', marginTop: '4px' }}>
                {inventoryTotals.low_stock_count}
              </div>
            </div>
          </div>

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
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Tab: Mesas */}
      {activeSource === 'waiter' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Parrilla de Mesas:</span>
            <button 
              type="button"
              className="glass-card-interactive" 
              onClick={handleFetchTables}
              disabled={loading}
              style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-main)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={12} className={loading ? 'spin' : ''} />
              <span>Actualizar Mesas</span>
            </button>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(45, 62, 65, 0.5)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '12px' }}>
            Las comandas se registran en el punto de venta.
          </div>

          {tablesData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {tablesData.tables.map(table => (
                <div
                  key={table.id}
                  className="glass-card"
                  style={{
                    padding: '10px 8px',
                    borderRadius: '12px',
                    background: table.estado === 'libre' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.12)',
                    border: `1px solid ${table.estado === 'libre' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>Mesa {table.numero}</div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: table.estado === 'libre' ? 'var(--success)' : 'var(--error)' }}>
                    ● {table.estado.toUpperCase()}
                  </span>
                  {table.total > 0 && (
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', fontWeight: 600 }}>
                      ${table.total.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
