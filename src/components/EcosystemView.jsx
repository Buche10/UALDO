import React from 'react';
import { Building2, ShieldAlert, ArrowLeft } from 'lucide-react';
import DobleFiloCard from './DobleFiloCard';
import InventoryView from './InventoryView';
import CashCloseView from './CashCloseView';
import SupplyRequestsView from './supplyRequests/SupplyRequestsView';
import SalesView from './sales/SalesView';
import DailyCloseView from './inventory/dailyClose/DailyCloseView';
import ModuleGrid from './modules/ModuleGrid';
import { getModuleBySubView } from './modules/moduleRegistry';
import { getUser } from '../services/auth';
import { can, canAny, ABILITIES } from '../services/permissions';

export default function EcosystemView({
  subView = 'overview',
  onSubViewChange,
  negociosParams = null,
  onParamsConsumed,
}) {
  const currentSubTab = subView;
  const user = getUser();

  const handleSubTabChange = (newSubTab) => {
    if (onSubViewChange) {
      onSubViewChange(newSubTab);
    }
  };

  const moduleDef = getModuleBySubView(currentSubTab);
  const isRestricted = Boolean(moduleDef && !canAny(user, moduleDef.permissions));

  let content;
  if (currentSubTab === 'overview') {
    content = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={20} color="var(--accent)" aria-hidden="true" />
            <span>Ualdo Negocios</span>
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Gestión de caja, punto de venta e inventario del motor.
          </p>
        </div>

        <DobleFiloCard onNavigateToInventory={() => handleSubTabChange('inventory')} />

        <div>
          <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.5px' }}>
            Módulos disponibles
          </h3>
          <ModuleGrid user={user} onSelectModule={handleSubTabChange} />
        </div>
      </div>
    );
  } else if (isRestricted) {
    content = (
      <div
        className="glass-card"
        style={{
          padding: '24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <ShieldAlert size={32} color="var(--warning)" aria-hidden="true" />
        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
          Acceso restringido
        </h4>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Esta sección le corresponde a {moduleDef?.roleRequiredLabel || 'otro cargo'}.
        </p>
        <button
          type="button"
          onClick={() => handleSubTabChange('overview')}
          className="btn-secondary"
          style={{
            marginTop: '8px',
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '12px',
            border: '1px solid var(--border-glass)',
            background: 'var(--chip-bg)',
            color: 'var(--text-main)',
            cursor: 'pointer',
          }}
        >
          Volver a módulos
        </button>
      </div>
    );
  } else if (currentSubTab === 'ventas') {
    content = <SalesView onBack={() => handleSubTabChange('overview')} />;
  } else if (currentSubTab === 'cashclose') {
    content = <CashCloseView fechaInicial={negociosParams?.fecha} />;
  } else if (currentSubTab === 'inventory') {
    content = <InventoryView initialSubView={negociosParams?.subView} onBack={() => handleSubTabChange('overview')} />;
  } else if (currentSubTab === 'pedidos') {
    const openRequest = negociosParams?.id ? { id: negociosParams.id, nav: negociosParams.nav } : null;
    const canDecide = can(user, ABILITIES.SUPPLY_DECIDE);
    content = (
      <SupplyRequestsView
        canDecide={canDecide}
        userId={user?.id}
        openRequest={openRequest}
        onOpenConsumed={onParamsConsumed}
      />
    );
  } else if (currentSubTab === 'daily_close') {
    content = (
      <DailyCloseView
        user={user}
        initialDate={negociosParams?.date || negociosParams?.fecha}
        onBack={() => handleSubTabChange('overview')}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {currentSubTab !== 'overview' && !isRestricted && (
        <button
          type="button"
          onClick={() => handleSubTabChange('overview')}
          style={{
            alignSelf: 'flex-start',
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Volver a módulos</span>
        </button>
      )}

      {content}
    </div>
  );
}
