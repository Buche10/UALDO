import React from 'react';
import {
  Store,
  Package,
  Calculator,
  Building2,
  Plus,
} from 'lucide-react';
import DobleFiloCard from './DobleFiloCard';
import InventoryView from './InventoryView';
import CashCloseView from './CashCloseView';

export default function EcosystemView({
  registeredApps,
  onUpdateApps,
  onSendChatPrompt,
  subView = 'overview',
  onSubViewChange,
  negociosParams = null,
}) {
  const currentSubTab = subView;

  const handleSubTabChange = (newSubTab) => {
    if (onSubViewChange) {
      onSubViewChange(newSubTab);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Sub-Navegación de Negocios */}
      <div style={{ display: 'flex', gap: '8px', background: 'rgba(30, 41, 59, 0.6)', padding: '4px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
        <button
          type="button"
          onClick={() => handleSubTabChange('overview')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            background: currentSubTab === 'overview' ? 'var(--primary)' : 'transparent',
            color: currentSubTab === 'overview' ? '#fff' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Store size={16} />
          <span>Caja & POS</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabChange('inventory')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            background: currentSubTab === 'inventory' ? 'var(--primary)' : 'transparent',
            color: currentSubTab === 'inventory' ? '#fff' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Package size={16} />
          <span>Inventario</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabChange('cashclose')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            background: currentSubTab === 'cashclose' ? 'var(--primary)' : 'transparent',
            color: currentSubTab === 'cashclose' ? '#fff' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Calculator size={16} />
          <span>Cierre</span>
        </button>
      </div>

      {currentSubTab === 'cashclose' ? (
        <CashCloseView
          onBack={() => handleSubTabChange('overview')}
          fechaInicial={negociosParams?.fecha}
        />
      ) : currentSubTab === 'inventory' ? (
        <InventoryView />
      ) : (
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
      )}
    </div>
  );
}
