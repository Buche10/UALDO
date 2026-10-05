import React, { useState, useEffect } from 'react';
import { Globe, DollarSign, Package, CheckCircle2, Play, RefreshCw, AlertTriangle, ShieldCheck, Utensils, Users, Plus, Minus, Search, Send, ShoppingCart, Bell, ArrowRightLeft } from 'lucide-react';
import { getDoblefiloTables, getDoblefiloMenu, createDoblefiloOrder, fetchVercelInventory, updateVercelStock, getDoblefiloDailySummary, executeDoblefiloCashClose, fetchCanonicalInventory, fetchReorderAlerts, triggerInventoryReconciliation } from '../services/doblefiloEngine';
import { request } from '../services/apiClient';

export default function DobleFiloCard({ onSendChatPrompt }) {
  const [activeSource, setActiveSource] = useState('canonical'); // 'canonical' | 'motor' | 'waiter' | 'vercel'
  const [loading, setLoading] = useState(false);
  
  // Canonical Inventory State
  const [canonicalData, setCanonicalData] = useState(null);
  const [reorderAlerts, setReorderAlerts] = useState(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);



  // Real Motor State
  const [realSummary, setRealSummary] = useState(null);
  const [realInventory, setRealInventory] = useState(null);
  const [realOrders, setRealOrders] = useState(null);
  const [motorError, setMotorError] = useState(null);


  // Waiter Orders State
  const [tablesData, setTablesData] = useState(null);
  const [menuData, setMenuData] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [waiterName, setWaiterName] = useState('Carlos M.');
  const [orderCart, setOrderCart] = useState({});
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Vercel State
  const [vercelData, setVercelData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // POS State
  const [summaryData, setSummaryData] = useState(null);

  const fetchRealMotorData = async () => {
    setLoading(true);
    setMotorError(null);

    const [sumRes, invRes, ordRes] = await Promise.all([
      request('/restaurant/summary'),
      request('/inventory'),
      request('/orders')
    ]);

    setLoading(false);

    if (sumRes.ok) {
      setRealSummary(sumRes.data);
    } else {
      setMotorError(sumRes.error || 'Error al conectar con la API de Ualdo Negocios.');
    }

    if (invRes.ok) {
      setRealInventory(invRes.data);
    }

    if (ordRes.ok) {
      setRealOrders(ordRes.data);
    }
  };

  const handleFetchCanonicalData = async () => {
    setLoading(true);
    const [canonRes, alertsRes] = await Promise.all([
      fetchCanonicalInventory(),
      fetchReorderAlerts()
    ]);
    setCanonicalData(canonRes);
    setReorderAlerts(alertsRes);
    setLoading(false);
  };

  const handleRunReconciliation = async () => {
    setReconciling(true);
    setReconcileResult(null);
    const result = await triggerInventoryReconciliation();
    setReconcileResult(result);
    setReconciling(false);
    handleFetchCanonicalData();
  };

  useEffect(() => {
    fetchRealMotorData();
    handleFetchCanonicalData();
  }, []);


  const handleFetchTables = async () => {
    setLoading(true);
    const resTables = await getDoblefiloTables();
    const resMenu = await getDoblefiloMenu();
    setTablesData(resTables);
    setMenuData(resMenu.menu);
    setLoading(false);
  };

  const handleAddToCart = (dish) => {
    setOrderCart(prev => {
      const currentQty = prev[dish.id]?.cantidad || 0;
      return {
        ...prev,
        [dish.id]: {
          id: dish.id,
          nombre: dish.nombre,
          precio: dish.precio,
          cantidad: currentQty + 1
        }
      };
    });
  };

  const handleRemoveFromCart = (dishId) => {
    setOrderCart(prev => {
      const currentQty = prev[dishId]?.cantidad || 0;
      if (currentQty <= 1) {
        const updated = { ...prev };
        delete updated[dishId];
        return updated;
      }
      return {
        ...prev,
        [dishId]: {
          ...prev[dishId],
          cantidad: currentQty - 1
        }
      };
    });
  };

  const handleSendOrder = async (e) => {
    e.preventDefault();
    const cartItems = Object.values(orderCart);
    if (cartItems.length === 0 || !selectedTable) return;

    setLoading(true);
    const res = await createDoblefiloOrder({
      mesaId: selectedTable.id,
      numeroMesa: selectedTable.numero,
      mesero: waiterName,
      items: cartItems,
      observacion: orderNotes
    });

    setOrderSuccess(res.orderDetails);
    setShowOrderModal(false);
    setOrderCart({});
    setOrderNotes('');
    handleFetchTables();
    setLoading(false);
  };

  const handleSyncVercel = async () => {
    setLoading(true);
    const res = await fetchVercelInventory({ query: searchQuery });
    setVercelData(res);
    setLoading(false);
  };

  const handleFetchSummary = async () => {
    setLoading(true);
    const res = await getDoblefiloDailySummary();
    setSummaryData(res.summary);
    setLoading(false);
  };

  return (
    <div className="glass-card" style={{ padding: '18px', border: '1px solid var(--border-glow)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.14) 0%, rgba(15, 23, 42, 0.9) 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Utensils size={22} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              {realSummary ? `Restaurante: ${realSummary.business_name}` : 'Restaurante UALDO Motor'}
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: 600 }}>
              {realSummary ? 'Motor Laravel 12 (API Sanctum Real)' : 'Modo Conexión Motor'}
            </span>
          </div>
        </div>

        <button
          onClick={fetchRealMotorData}
          disabled={loading}
          className="glass-card-interactive"
          style={{ padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-main)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          <span>Sincronizar</span>
        </button>
      </div>

      {/* Source Tab Switcher */}
      <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px', marginBottom: '14px', border: '1px solid var(--border-glass)' }}>
        <button
          onClick={() => { setActiveSource('canonical'); if (!canonicalData) handleFetchCanonicalData(); }}
          style={{
            flex: 1,
            padding: '7px 4px',
            borderRadius: '8px',
            border: 'none',
            background: activeSource === 'canonical' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
            color: activeSource === 'canonical' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <ShoppingCart size={13} />
          <span>📦 Ledger Canónico</span>
        </button>

        <button
          onClick={() => setActiveSource('motor')}
          style={{
            flex: 1,
            padding: '7px 4px',
            borderRadius: '8px',
            border: 'none',
            background: activeSource === 'motor' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
            color: activeSource === 'motor' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <ShieldCheck size={13} />
          <span>🔥 Motor Real</span>
        </button>

        <button
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
            gap: '4px'
          }}
        >
          <Utensils size={13} />
          <span>🍽️ Mesas</span>
        </button>

        <button
          onClick={() => { setActiveSource('vercel'); if (!vercelData) handleSyncVercel(); }}
          style={{
            flex: 1,
            padding: '7px 4px',
            borderRadius: '8px',
            border: 'none',
            background: activeSource === 'vercel' ? 'var(--secondary)' : 'transparent',
            color: activeSource === 'vercel' ? '#000000' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <Globe size={13} />
          <span>☁️ Vercel</span>
        </button>
      </div>

      {/* CANONICAL INVENTORY & REORDER ALERTS TAB CONTENT */}
      {activeSource === 'canonical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Header Actions & Sync Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Sincronización Canónica</div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ● RunFood ↔ DobleFilo En Linea
              </div>
            </div>

            <button
              onClick={handleRunReconciliation}
              disabled={reconciling}
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              <ArrowRightLeft size={13} className={reconciling ? 'spin' : ''} />
              <span>{reconciling ? 'Reconciliando...' : 'Reconciliar Consumo'}</span>
            </button>
          </div>


          {reconcileResult && (
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', fontSize: '11px' }}>
              ✓ {reconcileResult.message} ({reconcileResult.synced_items_count} insumos actualizados)
            </div>
          )}


          {/* Reorder Purchase Alerts Widget (Phase 7) */}
          {reorderAlerts && reorderAlerts.alerts && reorderAlerts.alerts.length > 0 && (
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--error)', fontWeight: 800, fontSize: '12px' }}>
                  <Bell size={14} />
                  <span>Alertas Proactivas de Compra ({reorderAlerts.alerts_count})</span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Punto de Reorden Bajo</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {reorderAlerts.alerts.map(alert => (
                  <div key={alert.id} style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(244, 63, 94, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                    <div>
                      <strong style={{ color: '#ffffff' }}>{alert.supply_name}</strong>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Proveedor: {alert.supplier}</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--error)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        Stock: {alert.stock} / Min: {alert.reorder_point} {alert.unit}
                      </span>
                      <div style={{ fontSize: '10px', color: 'var(--success)', fontWeight: 700 }}>
                        Sugerido: +{alert.suggested_qty} {alert.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Canonical Supplies List */}
          {canonicalData && canonicalData.items && (
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Insumos Canónicos en Ledger ({canonicalData.items.length}):</span>
                <span>Actualizado: {new Date(canonicalData.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {canonicalData.items.map(item => (
                  <div key={item.id} style={{ padding: '8px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${item.is_low_stock ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-glass)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: item.is_low_stock ? 'var(--error)' : 'var(--text-main)' }}>
                        {item.name}
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Código: {item.code} | RF-ID: {item.provider_mapping?.runfood_id || 'N/A'}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: item.is_low_stock ? 'var(--error)' : 'var(--success)' }}>
                        {item.stock.toFixed(2)} {item.unit}
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--secondary)' }}>
                        P. Reorden: {item.reorder_point} {item.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}


      {/* MOTOR REAL API TAB CONTENT */}
      {activeSource === 'motor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {motorError ? (
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--error)', fontSize: '12px' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>⚠️ Error al conectar con Ualdo Negocios</div>
              <div>{motorError}</div>
            </div>
          ) : realSummary ? (
            <>
              {/* Stat Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Ventas Hoy</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                    ${(realSummary.totalVentas || 0).toFixed(2)}
                  </div>
                </div>

                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Pedidos Hoy</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                    {realSummary.numeroPedidos || 0}
                  </div>
                </div>

                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Bajo Stock</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--error)', fontFamily: 'var(--font-mono)' }}>
                    {realSummary.itemsBajoStock || 0}
                  </div>
                </div>
              </div>

              {/* Real Inventory Preview */}
              {realInventory?.items && realInventory.items.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Items de Inventario en Tiempo Real ({realInventory.totals?.total_items || realInventory.items.length}):
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                    {realInventory.items.slice(0, 5).map(item => (
                      <div key={item.id} style={{ padding: '8px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                        <div>
                          <strong>{item.name}</strong>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '6px' }}>({item.type})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: item.is_low_stock ? 'var(--error)' : 'var(--success)' }}>
                            Stock: {item.stock} {item.unit || ''}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--secondary)', fontWeight: 700 }}>
                            ${(item.price || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              Cargando métricas en tiempo real de Ualdo Negocios...
            </div>
          )}
        </div>
      )}

      {/* WAITER ORDERS TAB CONTENT */}
      {activeSource === 'waiter' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Parrilla de Mesas Mock:</span>
            <button 
              className="glass-card-interactive" 
              onClick={handleFetchTables}
              disabled={loading}
              style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-main)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={12} className={loading ? 'spin' : ''} />
              <span>Actualizar Mesas</span>
            </button>
          </div>

          {orderSuccess && (
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              ✓ Pedido #{orderSuccess.idPedido} enviado a {orderSuccess.mesa} ({orderSuccess.total}). Despachado a Monitor Cocina.
            </div>
          )}

          {/* Tables Grid */}
          {tablesData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {tablesData.tables.map(table => (
                <div
                  key={table.id}
                  className="glass-card-interactive"
                  onClick={() => { setSelectedTable(table); setShowOrderModal(true); }}
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
                    cursor: 'pointer',
                    textAlign: 'center'
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

      {/* VERCEL APP TAB CONTENT */}
      {activeSource === 'vercel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar producto en Vercel..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, fontSize: '12px' }}
            />
            <button className="btn-primary" onClick={handleSyncVercel} style={{ padding: '8px 12px', fontSize: '12px' }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>

          {vercelData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              {vercelData.items.slice(0, 5).map(item => (
                <div key={item.id} style={{ padding: '8px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span>[{item.id}] {item.nombre}</span>
                  <strong style={{ color: 'var(--secondary)' }}>🏬 {item.bodega} | 🍳 {item.cocina}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ORDER TAKING MODAL FOR WAITERS */}
      {showOrderModal && selectedTable && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '18px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Tomar Pedido - Mesa {selectedTable.numero} ({selectedTable.grupo})
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: 600 }}>
                  Estado: {selectedTable.estado.toUpperCase()} {selectedTable.total > 0 ? `| Actual: $${selectedTable.total.toFixed(2)}` : ''}
                </span>
              </div>
            </div>

            <form onSubmit={handleSendOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '4px' }}>
              <div className="form-group">
                <label className="form-label">Mesero a Cargo</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={waiterName} 
                  onChange={e => setWaiterName(e.target.value)}
                  placeholder="Nombre del mesero..."
                />
              </div>

              {/* Menu Selection */}
              <div>
                <label className="form-label">Seleccionar Platos & Bebidas</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', marginTop: '4px' }}>
                  {(menuData || []).map(dish => {
                    const inCartQty = orderCart[dish.id]?.cantidad || 0;
                    return (
                      <div key={dish.id} style={{ padding: '8px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{dish.nombre}</div>
                          <div style={{ fontSize: '11px', color: 'var(--secondary)', fontFamily: 'var(--font-mono)' }}>${dish.precio.toFixed(2)}</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {inCartQty > 0 && (
                            <button type="button" onClick={() => handleRemoveFromCart(dish.id)} style={{ width: '26px', height: '26px', borderRadius: '50%', border: 'none', background: 'rgba(244,63,94,0.2)', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Minus size={14} />
                            </button>
                          )}

                          {inCartQty > 0 && <span style={{ fontWeight: 800, fontSize: '13px', width: '16px', textAlign: 'center' }}>{inCartQty}</span>}

                          <button type="button" onClick={() => handleAddToCart(dish)} style={{ width: '26px', height: '26px', borderRadius: '50%', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Notas Especiales para Cocina</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="ej. Término medio, sin salsa..." 
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                />
              </div>

              {/* Total and Actions */}
              <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Comanda:</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                    ${Object.values(orderCart).reduce((acc, i) => acc + (i.precio * i.cantidad), 0).toFixed(2)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="glass-card" onClick={() => setShowOrderModal(false)} style={{ padding: '10px 14px', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={Object.keys(orderCart).length === 0} style={{ padding: '10px 16px' }}>
                    <Send size={14} />
                    <span>Enviar a Cocina</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
