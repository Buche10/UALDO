import React, { useState, useRef, useEffect } from 'react';
import { Package, Plus, Search } from 'lucide-react';
import { getUser } from '../services/auth';
import { useInventoryList } from '../hooks/useInventoryList';
import InventoryList from './inventory/InventoryList';
import MovementModal from './inventory/MovementModal';
import ItemCreateModal from './inventory/ItemCreateModal';
import MovementsHistoryModal from './inventory/MovementsHistoryModal';

export default function InventoryView() {
  const {
    items,
    alerts,
    totals,
    loading,
    loadingMore,
    error,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    hasMore,
    reload,
    loadNextPage,
    updateItemStock,
  } = useInventoryList();

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItemForMovement, setSelectedItemForMovement] = useState(null);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimerRef = useRef(null);

  const currentUser = getUser();
  const isOwner = Boolean(currentUser?.capabilities?.is_owner || currentUser?.role === 'owner');

  const showToast = (msg, type = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage({ msg, type });
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleMovementRegistered = ({ message, item }) => {
    showToast(message, 'success');
    if (item) {
      updateItemStock(item.id, item.stock);
    } else {
      reload();
    }
  };

  const handleItemCreated = () => {
    showToast('Insumo creado exitosamente.', 'success');
    reload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {toastMessage && (
        <div style={{ padding: '10px 14px', background: toastMessage.type === 'error' ? 'var(--error)' : 'var(--primary)', color: 'var(--on-primary)', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}>
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
      <div style={{ display: 'flex', gap: '6px', background: 'var(--chip-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
        {[
          { id: 'all', label: 'Todos' },
          { id: 'low_stock', label: 'Stock Bajo' },
          { id: 'alerts', label: 'Alertas' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--on-primary)' : 'var(--text-muted)',
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
          <button type="button" onClick={reload} className="btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
            Reintentar
          </button>
        </div>
      ) : (
        <InventoryList
          activeTab={activeTab}
          items={items}
          alerts={alerts}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadNextPage}
          onSelectForMovement={setSelectedItemForMovement}
          onSelectForHistory={setSelectedItemForHistory}
        />
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
