import React from 'react';
import InventoryView from '../InventoryView';
import PurchasesView from '../inventory/purchases/PurchasesView';
import PurchasesToReceiveView from '../inventory/purchases/PurchasesToReceiveView';
import CashCloseView from '../CashCloseView';
import CashDeclarationView from '../cashclose/declaration/CashDeclarationView';
import SupplyRequestsView from '../supplyRequests/SupplyRequestsView';
import SalesView from '../sales/SalesView';
import DailyCloseView from '../inventory/dailyClose/DailyCloseView';
import WithdrawalsView from '../withdrawals/WithdrawalsView';
import OvertimeView from '../overtime/OvertimeView';
import IncidentsView from '../incidents/IncidentsView';
import AssetsView from '../assets/AssetsView';
import LotsView from '../lots/LotsView';
import ReservationsView from '../reservations/ReservationsView';
import ActivityView from '../activity/ActivityView';
import { can, ABILITIES } from '../../services/permissions';

const renderPurchases = ({ user, onNavigate }) => (
  can(user, ABILITIES.PURCHASES_MANAGE) ? (
    <PurchasesView onBack={() => onNavigate('overview')} />
  ) : (
    <PurchasesToReceiveView
      canSeeCosts={can(user, ABILITIES.INVENTORY_COSTS)}
      onBack={() => onNavigate('overview')}
    />
  )
);

const renderPedidos = ({ user, negociosParams, onParamsConsumed }) => {
  const openRequest = negociosParams?.id ? { id: negociosParams.id, nav: negociosParams.nav } : null;
  return (
    <SupplyRequestsView
      canDecide={can(user, ABILITIES.SUPPLY_DECIDE)}
      userId={user?.id}
      openRequest={openRequest}
      onOpenConsumed={onParamsConsumed}
    />
  );
};

const RENDERERS = {
  reservations: ({ user, negociosParams, onNavigate }) => (
    <ReservationsView
      key={negociosParams?.nav || 'reservations'}
      user={user}
      initialId={negociosParams?.id}
      onBack={() => onNavigate('overview')}
    />
  ),
  ventas: ({ onNavigate }) => <SalesView onBack={() => onNavigate('overview')} />,
  cash_declaration: ({ negociosParams, onNavigate }) => (
    <CashDeclarationView
      fechaInicial={negociosParams?.fecha || negociosParams?.date}
      onBack={() => onNavigate('overview')}
    />
  ),
  cashclose: ({ negociosParams }) => <CashCloseView fechaInicial={negociosParams?.fecha} />,
  inventory: ({ negociosParams, onNavigate }) => (
    <InventoryView initialSubView={negociosParams?.subView} onBack={() => onNavigate('overview')} />
  ),
  purchases: renderPurchases,
  pedidos: renderPedidos,
  withdrawals: ({ user, negociosParams }) => (
    <WithdrawalsView user={user} initialId={negociosParams?.id} />
  ),
  daily_close: ({ user, negociosParams, onNavigate }) => (
    <DailyCloseView
      user={user}
      initialDate={negociosParams?.date || negociosParams?.fecha}
      onBack={() => onNavigate('overview')}
    />
  ),
  overtime: ({ user, negociosParams, onNavigate }) => (
    <OvertimeView
      user={user}
      initialMonth={negociosParams?.mes || negociosParams?.month}
      initialStatus={negociosParams?.status}
      onBack={() => onNavigate('overview')}
    />
  ),
  incidents: ({ user, negociosParams, onNavigate }) => (
    <IncidentsView
      user={user}
      initialId={negociosParams?.id}
      onBack={() => onNavigate('overview')}
    />
  ),
  assets: ({ user, negociosParams, onNavigate }) => (
    <AssetsView
      user={user}
      initialTab={negociosParams?.tab || negociosParams?.initialTab}
      onBack={() => onNavigate('overview')}
      onNavigateToIncident={() => onNavigate('incidents')}
    />
  ),
  lots: ({ user, onNavigate }) => (
    <LotsView
      canManage={can(user, ABILITIES.LOTS_MANAGE)}
      canSeeCosts={can(user, ABILITIES.INVENTORY_COSTS)}
      onBack={() => onNavigate('overview')}
    />
  ),
  activity: ({ onNavigate }) => (
    <ActivityView
      onBack={() => onNavigate('overview')}
      onNavigate={onNavigate}
    />
  ),
};

export default function EcosystemModules(props) {
  const render = RENDERERS[props.currentSubTab];
  return render ? render(props) : null;
}
