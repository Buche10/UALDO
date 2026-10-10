import React, { useState } from 'react';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { usePurchases } from '../../../hooks/usePurchasesData';
import PurchaseList from './PurchaseList';
import PurchaseForm from './PurchaseForm';
import PurchaseDetail from './PurchaseDetail';
import SuppliersPanel from './SuppliersPanel';
import ValuationPanel from './ValuationPanel';

const TABS = [
  { id: 'purchases', label: 'Compras' },
  { id: 'suppliers', label: 'Proveedores' },
  { id: 'valuation', label: 'Valor' },
];

const NOTICES = {
  created: 'Compra guardada como borrador.',
  idempotent: 'Ya estaba registrada.',
  receive: 'Compra recibida: el stock y los costos se actualizaron.',
  cancel: 'Compra cancelada.',
  lines: 'Líneas guardadas.',
};

/**
 * Compras, proveedores y valor del inventario (Brief 20p). Solo el dueño
 * llega aquí; el motor igual responde 403 al personal.
 */
export default function PurchasesView({ onBack }) {
  const [tab, setTab] = useState('purchases');
  const [screen, setScreen] = useState('list');
  const [purchase, setPurchase] = useState(null);
  const [status, setStatus] = useState('');
  const [notice, setNotice] = useState(null);
  const list = usePurchases(status);

  const show = (updated, kind) => {
    list.upsert(updated);
    setPurchase(updated);
    setScreen('detail');
    setNotice(NOTICES[kind] || null);
  };

  const backToList = () => { setNotice(null); setScreen('list'); };

  let content;
  if (tab === 'suppliers') content = <SuppliersPanel />;
  else if (tab === 'valuation') content = <ValuationPanel />;
  else if (screen === 'new') content = <PurchaseForm onBack={backToList} onCreated={(created, idempotent) => show(created, idempotent ? 'idempotent' : 'created')} />;
  else if (screen === 'detail' && purchase) content = <PurchaseDetail key={purchase.id} purchase={purchase} onBack={backToList} onUpdated={show} />;
  else content = <PurchaseList list={list} status={status} onStatusChange={setStatus} onOpen={(p) => { setNotice(null); setPurchase(p); setScreen('detail'); }} onNew={() => { setNotice(null); setScreen('new'); }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <h2 className="section-title" style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingCart size={18} color="var(--accent)" />
          <span>Compras y proveedores</span>
        </h2>
        <button type="button" onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
          <ArrowLeft size={16} />
          <span>Inventario</span>
        </button>
      </div>

      <div role="tablist" aria-label="Secciones de compras" style={{ display: 'flex', gap: '6px', background: 'var(--chip-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); setNotice(null); }} style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: 'none', background: tab === t.id ? 'var(--primary)' : 'transparent', color: tab === t.id ? 'var(--on-primary)' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div role="status" aria-live="polite">
        {notice && <div style={{ padding: '10px 14px', background: 'var(--success-soft)', color: 'var(--success)', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}>{notice}</div>}
      </div>

      {content}
    </div>
  );
}
