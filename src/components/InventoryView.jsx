import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  History, 
  ArrowRightLeft,
  Bell
} from 'lucide-react';
import { listInventory, fetchAlerts } from '../services/inventoryClient';
import { getUser } from '../services/auth';
import MovementModal from './inventory/MovementModal';
import ItemCreateModal from './inventory/ItemCreateModal';
import MovementsHistoryModal from './inventory/MovementsHistoryModal';

export default function InventoryView() {
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [totals, setTotals] = useState({ count: 0, low_stock_count: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'low_stock' | 'alerts'
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItemForMovement, setSelectedItemForMovement] = useState(null);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const currentUser = getUser();
  const isOwner = Boolean(currentUser?.capabilities?.is_owner || currentUser?.role === 'owner');

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Debounce búsqueda 300 ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadData = useCallback(async (pageToLoad = 1, append = false) => {
    if (pageToLoad === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      if (activeTab === 'alerts') {
        const resAlerts = await fetchAlerts();
        setLoading(false);
        if (resAlerts.ok && resAlerts.data) {
          setAlerts(resAlerts.data.alerts || []);
        } else {
          setError(resAlerts.error || 'Error al cargar alertas.');
        }
        return;
      }

      const res = await listInventory({
        search: debouncedSearch,
        low_stock: activeTab === 'low_stock',
        page: pageToLoad,
      });

      if (pageToLoad === 1) setLoading(false);
      else setLoadingMore(false);

      if (res.ok && res.data) {
        const fetchedItems = res.data.items || res.data.data || [];
        setItems(prev => append ? [...prev, ...fetchedItems] : fetchedItems);
        setTotals(res.data.totals || { count: fetchedItems.length, low_stock_count: 0 });
        const meta = res.data.meta || {};
        setHasMore(meta.current_page < meta.last_page);
        setPage(pageToLoad);
      } else {
        setError(res.error || 'Error al cargar el inventario.');
      }
    } catch {
      setLoading(false);
      setLoadingMore(false);
      setError('Error de conexión al cargar datos.');
    }
  }, [activeTab, debouncedSearch]);

  useEffect(() => {
    loadData(1, false);
  }, [loadData]);

  const handleMovementRegistered = ({ message, item }) => {
    showToast(message, 'success');
    if (item) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, stock: item.stock } : i));
    } else {
      loadData(1, false);
    }
  };

  const handleItemCreated = (newItem) => {
    showToast('Insumo creado exitosamente.', 'success');
    loadData(1, false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {toastMessage && (
        <div style={{ padding: '10px 14px', background: toastMessage.type === 'error' ? 'var(--error)' : 'var(--primary)', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}>
          {toastMessage.msg}
        </div>
      )}

      {/* Cabecera y acciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={20} color="var(--accent)" />
            <span>Inventario del Motor</span>
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Fuente de verdad del restaurante ({totals.count} insumos, {totals.low_stock_count} con stock bajo).
          </p>
        </div>

        {isOwner && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>Nuevo Insumo</span>
          </button>
        )}
      </div>

      {/* Pestañas: Todos / Stock bajo / Alertas */}
      <div style={{ display: 'flex', gap: '6px', background: 'rgba(32, 45, 47, 0.6)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
        {[
          { id: 'all', label: 'Todos' },
          { id: 'low_stock', label: 'Stock Bajo' },
          { id: 'alerts', label: 'Alertas' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setActiveTab(tab.id); setPage(1); }}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Barra de búsqueda (solo en pestañas con catálogo) */}
      {activeTab !== 'alerts' && (
        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input"
            style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)', fontSize: '13px' }}
          />
        </div>
      )}

      {/* Contenido principal */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando inventario...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--error)' }}>
          <p style={{ fontSize: '13px', marginBottom: '10px' }}>{error}</p>
          <button type="button" onClick={() => loadData(1, false)} className="btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
            Reintentar
          </button>
        </div>
      ) : activeTab === 'alerts' ? (
        /* Vista de Alertas de Compra */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No hay alertas de compra activas. El stock está dentro de los niveles óptimos.
            </div>
          ) : (
            alerts.map(a => (
              <div
                key={a.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid var(--warning)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {a.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--warning)', marginTop: '2px' }}>
                    Stock actual: {Number(a.stock).toFixed(3)} {a.unit} (Mínimo: {Number(a.min_stock).toFixed(3)})
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sugerido comprar:</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>
                    {Number(a.suggested_qty).toFixed(3)} {a.unit}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Listado de Insumos */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No se encontraron insumos.
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'var(--bg-card)',
                  border: item.is_low_stock ? '1px solid var(--warning)' : '1px solid var(--border-glass)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {item.name}
                    </span>
                    {item.is_low_stock && (
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)', fontWeight: 700 }}>
                        Bajo
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, marginTop: '2px' }}>
                    {Number(item.stock).toFixed(3)} {item.unit}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedItemForHistory(item)}
                    title="Ver historial de movimientos"
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-glass)',
                      background: 'rgba(32, 45, 47, 0.8)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    <History size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedItemForMovement(item)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--primary-2)',
                      background: 'var(--primary)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ArrowRightLeft size={14} />
                    <span>Mover</span>
                  </button>
                </div>
              </div>
            ))
          )}

          {hasMore && (
            <button
              type="button"
              onClick={() => loadData(page + 1, true)}
              disabled={loadingMore}
              className="glass-card-interactive"
              style={{
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid var(--border-glass)',
                background: 'rgba(32, 45, 47, 0.7)',
                color: 'var(--accent)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                marginTop: '6px',
              }}
            >
              {loadingMore ? 'Cargando más...' : 'Cargar más insumos'}
            </button>
          )}
        </div>
      )}

      {/* Modales */}
      <MovementModal
        isOpen={Boolean(selectedItemForMovement)}
        item={selectedItemForMovement}
        onClose={() => setSelectedItemForMovement(null)}
        onMovementRegistered={handleMovementRegistered}
      />

      <ItemCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onItemCreated={handleItemCreated}
      />

      <MovementsHistoryModal
        isOpen={Boolean(selectedItemForHistory)}
        item={selectedItemForHistory}
        onClose={() => setSelectedItemForHistory(null)}
      />
    </div>
  );
}
