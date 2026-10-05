import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Search, 
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  Bell
} from 'lucide-react';
import { fetchInventory, createInventoryItem, addInventoryMovement, fetchInventoryAlerts } from '../services/inventoryClient';

export default function InventoryView() {
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({ total_items: 0, low_stock_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'low_stock', 'alerts'
  
  // Modales
  const [showItemModal, setShowItemModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedItemForMovement, setSelectedItemForMovement] = useState(null);

  // Form states
  const [newItem, setNewItem] = useState({
    name: '',
    code: '',
    type: 'supply',
    unit: 'KG',
    stock: '',
    min_stock: '',
    reorder_point: '',
    supplier: '',
  });

  const [movement, setMovement] = useState({
    product_identifier: '',
    quantity: '',
    type: 'input',
    reason: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, alertRes] = await Promise.all([
        fetchInventory(),
        fetchInventoryAlerts(),
      ]);

      if (invRes.ok && invRes.data) {
        setItems(invRes.data.items || []);
        setSummary(invRes.data.summary || { total_items: 0, low_stock_count: 0 });
      } else {
        setError(invRes.error || 'No se pudo cargar el inventario');
      }

      if (alertRes.ok && alertRes.data) {
        setAlerts(alertRes.data.alerts || []);
      }
    } catch (err) {
      setError('Error de conexión al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    setSubmitting(true);
    const res = await createInventoryItem(newItem);
    setSubmitting(false);

    if (res.ok) {
      showToast('Ítem creado exitosamente', 'success');
      setShowItemModal(false);
      setNewItem({
        name: '',
        code: '',
        type: 'supply',
        unit: 'KG',
        stock: '',
        min_stock: '',
        reorder_point: '',
        supplier: '',
      });
      loadData();
    } else {
      showToast(res.error || 'Error al crear ítem', 'error');
    }
  };

  const handleRegisterMovement = async (e) => {
    e.preventDefault();
    if (!movement.product_identifier || !movement.quantity) return;

    setSubmitting(true);
    const itemId = selectedItemForMovement?.id || 0;
    const res = await addInventoryMovement(itemId, {
      ...movement,
      quantity: parseFloat(movement.quantity),
    });
    setSubmitting(false);

    if (res.ok) {
      showToast('Movimiento registrado correctamente', 'success');
      setShowMovementModal(false);
      setMovement({ product_identifier: '', quantity: '', type: 'input', reason: '' });
      setSelectedItemForMovement(null);
      loadData();
    } else {
      showToast(res.error || 'Error al registrar movimiento', 'error');
    }
  };

  const openMovementForItem = (item) => {
    setSelectedItemForMovement(item);
    setMovement({
      product_identifier: item.code || item.name,
      quantity: '',
      type: 'input',
      reason: '',
    });
    setShowMovementModal(true);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.code && item.code.toLowerCase().includes(search.toLowerCase()));
    if (activeTab === 'low_stock') return matchesSearch && item.is_low_stock;
    return matchesSearch;
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: "'Poppins', sans-serif",
      padding: '16px',
      paddingBottom: '80px'
    }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          left: '20px',
          zIndex: 9999,
          padding: '12px 16px',
          borderRadius: '12px',
          backgroundColor: toastMessage.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: '#fff',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
        }}>
          {toastMessage.type === 'error' ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package style={{ color: '#38bdf8' }} /> Inventario Canónico
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Control de insumos y stock sincronizado
          </p>
        </div>
        <button
          onClick={loadData}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '10px',
            padding: '8px',
            color: '#cbd5e1',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <Package size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{summary.total_items}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Insumos</div>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.25)', color: '#f87171' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171' }}>{summary.low_stock_count}</div>
            <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}>Bajo Stock</div>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setShowItemModal(true)}
          style={{
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            border: 'none',
            borderRadius: '12px',
            padding: '12px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'Center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
          }}
        >
          <Plus size={18} /> Nuevo Insumo
        </button>

        <button
          onClick={() => { setSelectedItemForMovement(null); setShowMovementModal(true); }}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            padding: '12px',
            color: '#e2e8f0',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <ArrowUpRight size={18} style={{ color: '#38bdf8' }} /> Registrar Movimiento
        </button>
      </div>

      {/* Barra de Búsqueda y Pestañas */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          position: 'relative',
          marginBottom: '12px'
        }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '10px 12px 10px 38px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              background: activeTab === 'all' ? '#38bdf8' : 'transparent',
              color: activeTab === 'all' ? '#0f172a' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Todos ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('low_stock')}
            style={{
              background: activeTab === 'low_stock' ? '#ef4444' : 'transparent',
              color: activeTab === 'low_stock' ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Bajo Stock ({summary.low_stock_count})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            style={{
              background: activeTab === 'alerts' ? '#f59e0b' : 'transparent',
              color: activeTab === 'alerts' ? '#0f172a' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Alertas ({alerts.length})
          </button>
        </div>
      </div>

      {/* Lista de Items / Alertas */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <RefreshCw size={28} className="animate-spin" style={{ marginBottom: '12px', color: '#38bdf8' }} />
          <div>Cargando inventario...</div>
        </div>
      ) : activeTab === 'alerts' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
              No hay alertas de reorden pendientes.
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fbbf24' }}>
                    {alert.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '2px' }}>
                    Stock actual: <strong>{alert.stock} {alert.unit}</strong> | Punto reorden: {alert.reorder_point}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                    Sugerido a pedir: <strong>{alert.suggested_qty} {alert.unit}</strong>
                  </div>
                </div>
                <Bell size={20} style={{ color: '#fbbf24' }} />
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
              No se encontraron insumos.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: item.is_low_stock ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc' }}>{item.name}</span>
                    {item.code && (
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                        {item.code}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                    Mínimo: {item.min_stock} {item.unit} {item.supplier ? `• ${item.supplier}` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      color: item.is_low_stock ? '#f87171' : '#38bdf8'
                    }}>
                      {item.stock} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>{item.unit}</span>
                    </div>
                    {item.is_low_stock && (
                      <span style={{ fontSize: '0.65rem', color: '#f87171', fontWeight: 600, display: 'block' }}>
                        ¡BAJO STOCK!
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => openMovementForItem(item)}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      color: '#38bdf8',
                      cursor: 'pointer'
                    }}
                    title="Ajustar stock"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Nuevo Insumo */}
      {showItemModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '16px'
        }}>
          <div style={{
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px',
            padding: '24px', width: '100%', maxWidth: '420px', color: '#fff'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 700 }}>Nuevo Insumo</h2>
            <form onSubmit={handleCreateItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Nombre del insumo (ej: Harina)"
                required
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                style={inputStyle}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Código (opcional)"
                  value={newItem.code}
                  onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Unidad (KG, L, UNID)"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Stock inic."
                  value={newItem.stock}
                  onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                  style={inputStyle}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Stock mín."
                  value={newItem.min_stock}
                  onChange={(e) => setNewItem({ ...newItem, min_stock: e.target.value })}
                  style={inputStyle}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Pto. reorden"
                  value={newItem.reorder_point}
                  onChange={(e) => setNewItem({ ...newItem, reorder_point: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <input
                type="text"
                placeholder="Proveedor (opcional)"
                value={newItem.supplier}
                onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                style={inputStyle}
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  style={{ ...btnStyle, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ ...btnStyle, background: '#0284c7', color: '#fff' }}
                >
                  {submitting ? 'Guardando...' : 'Crear Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Movimiento */}
      {showMovementModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '16px'
        }}>
          <div style={{
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px',
            padding: '24px', width: '100%', maxWidth: '420px', color: '#fff'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 700 }}>Registrar Movimiento</h2>
            <form onSubmit={handleRegisterMovement} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Insumo / Producto</label>
                <input
                  type="text"
                  placeholder="Código o nombre..."
                  required
                  value={movement.product_identifier}
                  onChange={(e) => setMovement({ ...movement, product_identifier: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Cantidad</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    value={movement.quantity}
                    onChange={(e) => setMovement({ ...movement, quantity: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Tipo</label>
                  <select
                    value={movement.type}
                    onChange={(e) => setMovement({ ...movement, type: e.target.value })}
                    style={{ ...inputStyle, padding: '10px' }}
                  >
                    <option value="input">Entrada (+)</option>
                    <option value="output">Salida (-)</option>
                    <option value="adjustment">Ajuste Directo</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Motivo (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Compra, merma, rotura..."
                  value={movement.reason}
                  onChange={(e) => setMovement({ ...movement, reason: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  style={{ ...btnStyle, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ ...btnStyle, background: '#38bdf8', color: '#0f172a' }}
                >
                  {submitting ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  backgroundColor: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  padding: '10px 12px',
  color: '#fff',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const btnStyle = {
  flex: 1,
  padding: '10px',
  borderRadius: '10px',
  border: 'none',
  fontWeight: 600,
  fontSize: '0.85rem',
  cursor: 'pointer'
};
