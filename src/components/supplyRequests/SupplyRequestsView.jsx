import React, { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useSupplyRequests } from '../../hooks/useSupplyRequests';
import SupplyRequestList from './SupplyRequestList';
import SupplyRequestForm from './SupplyRequestForm';
import SupplyRequestDetail from './SupplyRequestDetail';
import ShoppingListPanel from './ShoppingListPanel';

const OWNER_TABS = [{ id: 'requests', label: 'Pedidos' }, { id: 'shopping', label: 'Lista de compras' }];

function RequestsTabs({ tab, onSelect }) {
  return (
    <div role="tablist" aria-label="Secciones de pedidos" style={{ display: 'flex', gap: '6px', background: 'var(--chip-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
      {OWNER_TABS.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => onSelect(t.id)} style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: 'none', background: tab === t.id ? 'var(--primary)' : 'transparent', color: tab === t.id ? 'var(--on-primary)' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Título, pestañas del resolutor (supply.decide) y aviso de la última acción. */
function RequestsHeader({ canDecide = false, tab, notice, onSelectTab }) {
  return (
    <>
      <h2 className="section-title" style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ClipboardList size={18} color="var(--accent)" aria-hidden="true" />
        <span>{canDecide ? 'Pedidos internos' : 'Mis pedidos'}</span>
      </h2>
      {canDecide && <RequestsTabs tab={tab} onSelect={onSelectTab} />}
      <div role="status" aria-live="polite">
        {notice && <div style={{ padding: '10px 14px', background: 'var(--success-soft)', color: 'var(--success)', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}>{notice}</div>}
      </div>
    </>
  );
}

/**
 * Pedidos internos (Brief 22p / 30p). Cualquier miembro pide y sigue sus pedidos;
 * quien posee supply.decide ve todos, decide y tiene la lista de compras.
 */
export default function SupplyRequestsView({ canDecide = false, userId, openRequest = null, onOpenConsumed }) {
  const [tab, setTab] = useState('requests');
  const [screen, setScreen] = useState('list');
  const [detail, setDetail] = useState({ id: null, version: 0 });
  const [status, setStatus] = useState(canDecide ? 'pending' : '');
  const [notice, setNotice] = useState(null);
  const list = useSupplyRequests(status);

  useEffect(() => {
    if (!openRequest?.id) return;
    setTab('requests');
    setNotice(null);
    setDetail((prev) => ({ id: openRequest.id, version: prev.version + 1 }));
    setScreen('detail');
    if (onOpenConsumed) onOpenConsumed();
    // Solo una navegación nueva (nav) abre el pedido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRequest?.id, openRequest?.nav]);

  const syncList = (request) => {
    if (!request?.id) return;
    if (!status || request.status === status) list.upsert(request);
    else list.remove(request.id);
  };

  const showDetail = (id, message) => {
    setDetail((prev) => ({ id, version: prev.version + 1 }));
    setScreen('detail');
    setNotice(message || null);
  };

  const backToList = () => { setNotice(null); setScreen('list'); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <RequestsHeader canDecide={canDecide} tab={tab} notice={notice} onSelectTab={(id) => { setTab(id); setNotice(null); }} />

      {/* Pedidos queda montado (oculto) en la otra pestaña: un pedido a medias conserva lo escrito y su client_uuid. */}
      <div role="tabpanel" hidden={tab !== 'requests'}>
        {screen === 'new' && <SupplyRequestForm onBack={backToList} onCreated={(created, idempotent) => { syncList(created); showDetail(created?.id, idempotent ? 'Ya estaba enviado.' : 'Pedido enviado. El dueño recibe el aviso en la app.'); }} />}
        {screen === 'detail' && detail.id && (
          <SupplyRequestDetail
            key={`${detail.id}-${detail.version}`}
            requestId={detail.id}
            canDecide={canDecide}
            userId={userId}
            onBack={backToList}
            onSynced={(updated, message) => { syncList(updated); setNotice(message || null); }}
          />
        )}
        {screen === 'list' && (
          <SupplyRequestList
            list={list}
            status={status}
            onStatusChange={setStatus}
            canDecide={canDecide}
            onOpen={(r) => showDetail(r.id, null)}
            onNew={() => { setNotice(null); setScreen('new'); }}
          />
        )}
      </div>
      {tab === 'shopping' && canDecide && (
        <div role="tabpanel">
          <ShoppingListPanel
            onViewRequest={(id) => { setTab('requests'); showDetail(id, null); }}
            canDecide={canDecide}
          />
        </div>
      )}
    </div>
  );
}
