import React from 'react';
import {
  Store,
  Package,
  Calculator,
  Building2,
  ClipboardList,
} from 'lucide-react';
import DobleFiloCard from './DobleFiloCard';
import InventoryView from './InventoryView';
import CashCloseView from './CashCloseView';
import SupplyRequestsView from './supplyRequests/SupplyRequestsView';
import { getUser } from '../services/auth';

const SUB_TABS = [
  { id: 'overview', label: 'Caja & POS', icon: Store },
  { id: 'inventory', label: 'Inventario', icon: Package },
  { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { id: 'cashclose', label: 'Cierre', icon: Calculator },
];

/** Botón de la subnavegación de Negocios, con colores por variables. */
function SubTabButton({ tab, active, onSelect }) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(tab.id)}
      aria-pressed={active}
      style={{
        flex: 1,
        padding: '10px 8px',
        borderRadius: '10px',
        border: 'none',
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? 'var(--on-primary)' : 'var(--text-muted)',
        fontWeight: 600,
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <Icon size={16} />
      <span>{tab.label}</span>
    </button>
  );
}

export default function EcosystemView({
  subView = 'overview',
  onSubViewChange,
  negociosParams = null,
  onParamsConsumed,
}) {
  const currentSubTab = subView;
  const user = getUser();
  const isOwner = Boolean(user?.capabilities?.is_owner || user?.role === 'owner');

  const handleSubTabChange = (newSubTab) => {
    if (onSubViewChange) {
      onSubViewChange(newSubTab);
    }
  };

  let content;
  if (currentSubTab === 'cashclose') {
    content = <CashCloseView onBack={() => handleSubTabChange('overview')} fechaInicial={negociosParams?.fecha} />;
  } else if (currentSubTab === 'inventory') {
    content = <InventoryView />;
  } else if (currentSubTab === 'pedidos') {
    const openRequest = negociosParams?.id ? { id: negociosParams.id, nav: negociosParams.nav } : null;
    content = <SupplyRequestsView isOwner={isOwner} userId={user?.id} openRequest={openRequest} onOpenConsumed={onParamsConsumed} />;
  } else {
    content = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={20} color="var(--accent)" />
            <span>Ualdo Negocios</span>
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Gestión de caja, punto de venta e inventario del motor.
          </p>
        </div>

        <DobleFiloCard onNavigateToInventory={() => handleSubTabChange('inventory')} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Sub-Navegación de Negocios */}
      <div style={{ display: 'flex', gap: '6px', background: 'var(--chip-bg)', padding: '4px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
        {SUB_TABS.map((tab) => (
          <SubTabButton key={tab.id} tab={tab} active={currentSubTab === tab.id} onSelect={handleSubTabChange} />
        ))}
      </div>

      {content}
    </div>
  );
}
