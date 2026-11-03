import React, { useState, useRef, useEffect } from 'react';
import { Package } from 'lucide-react';
import { getUser } from '../services/auth';
import { can, canAny, ABILITIES } from '../services/permissions';
import { useInventoryList } from '../hooks/useInventoryList';
import InventoryList from './inventory/InventoryList';
import InventoryHeaderActions from './inventory/InventoryHeaderActions';
import InventoryTabs from './inventory/InventoryTabs';
import InventoryModals from './inventory/InventoryModals';
import CountsView from './inventory/counts/CountsView';
import ProductionView from './inventory/production/ProductionView';
import PurchasesView from './inventory/purchases/PurchasesView';
import PurchasesToReceiveView from './inventory/purchases/PurchasesToReceiveView';
import RunfoodRecipesView from './runfood/RunfoodRecipesView';

export default function InventoryView({ initialSubView = null }) {
  const {
    items,
    alerts,
    totals,
    loading,
    loadingMore,
    error,
    activeTab,
    setActiveTab,
    includeInactive,
    setIncludeInactive,
    search,
    setSearch,
    hasMore,
    reload,
    loadNextPage,
    updateItemStock,
  } = useInventoryList();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCountsView, setShowCountsView] = useState(false);
  const [showProductionView, setShowProductionView] = useState(false);
  const [showPurchasesView, setShowPurchasesView] = useState(false);
  const [showPurchasesToReceive, setShowPurchasesToReceive] = useState(false);
  const currentUser = getUser();
  const canManageSettings = can(currentUser, ABILITIES.SETTINGS_MANAGE);
  const canManagePurchases = can(currentUser, ABILITIES.PURCHASES_MANAGE);
  const canReceivePurchases = can(currentUser, ABILITIES.PURCHASES_RECEIVE) && !canManagePurchases;
  const canCount = canAny(currentUser, [
    ABILITIES.INVENTORY_COUNT_WAREHOUSE,
    ABILITIES.INVENTORY_COUNT_KITCHEN,
    ABILITIES.INVENTORY_COUNT_LOUNGE,
  ]);
  const canSeeCosts = can(currentUser, ABILITIES.INVENTORY_COSTS);
  const canVoidProduction = can(currentUser, ABILITIES.INVENTORY_ADJUST) || canManageSettings;

  const [showRunfoodRecipes, setShowRunfoodRecipes] = useState(initialSubView === 'runfood-recetas' && canManageSettings);
  const [selectedItemForMovement, setSelectedItemForMovement] = useState(null);
  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState(null);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage({ msg, type });
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleMovementRegistered = ({ message, item }) => {
    showToast(message, 'success');
    if (item) updateItemStock(item.id, item.stock);
    else reload();
  };

  const handleTransferSuccess = ({ message, item }) => {
    showToast(message, 'success');
    if (item) updateItemStock(item.id, item.stock, item);
    else reload();
  };

  if (showProductionView) {
    return (
      <ProductionView
        canSeeCosts={canSeeCosts}
        canVoid={canVoidProduction}
        onBack={() => { setShowProductionView(false); reload(); }}
      />
    );
  }

  if (showPurchasesView && canManagePurchases) {
    return <PurchasesView onBack={() => { setShowPurchasesView(false); reload(); }} />;
  }

  if (showPurchasesToReceive && canReceivePurchases) {
    return <PurchasesToReceiveView canSeeCosts={canSeeCosts} onBack={() => { setShowPurchasesToReceive(false); reload(); }} />;
  }

  if (showCountsView && canCount) {
    return <CountsView canCount={canCount} onBack={() => { setShowCountsView(false); reload(); }} />;
  }

  if (showRunfoodRecipes && canManageSettings) {
    return <RunfoodRecipesView onBack={() => { setShowRunfoodRecipes(false); reload(); }} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {toastMessage && (
        <div style={{ padding: '10px 14px', background: toastMessage.type === 'error' ? 'var(--error)' : 'var(--primary)', color: 'var(--on-primary)', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}>
          {toastMessage.msg}
        </div>
      )}

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

        <InventoryHeaderActions
          canManageSettings={canManageSettings}
          canManagePurchases={canManagePurchases}
          canReceivePurchases={canReceivePurchases}
          canCount={canCount}
          onProduction={() => setShowProductionView(true)}
          onPurchases={() => setShowPurchasesView(true)}
          onReceivePurchases={() => setShowPurchasesToReceive(true)}
          onCounts={() => setShowCountsView(true)}
          onRunfoodRecipes={() => setShowRunfoodRecipes(true)}
          onCreate={() => setShowCreateModal(true)}
        />
      </div>

      <InventoryTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        search={search}
        onSearchChange={setSearch}
        includeInactive={includeInactive}
        onIncludeInactiveChange={setIncludeInactive}
      />

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
          onSelectForTransfer={setSelectedItemForTransfer}
          onItemUpdated={reload}
        />
      )}

      <InventoryModals
        selectedItemForMovement={selectedItemForMovement}
        onCloseMovement={() => setSelectedItemForMovement(null)}
        onMovementRegistered={handleMovementRegistered}
        selectedItemForTransfer={selectedItemForTransfer}
        onCloseTransfer={() => setSelectedItemForTransfer(null)}
        onTransferSuccess={handleTransferSuccess}
        showCreateModal={showCreateModal}
        onCloseCreate={() => setShowCreateModal(false)}
        onItemCreated={() => { showToast('Insumo creado exitosamente.', 'success'); reload(); }}
        selectedItemForHistory={selectedItemForHistory}
        onCloseHistory={() => setSelectedItemForHistory(null)}
      />
    </div>
  );
}
