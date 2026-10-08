import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Layers, ShieldAlert } from 'lucide-react';
import { getUser } from '../../services/auth';
import PaymentMappingsPanel from './PaymentMappingsPanel';
import CommissionRatesPanel from './CommissionRatesPanel';

export default function CashConfigView({ onBack, initialTab = 'mappings' }) {
  const [activeTab, setActiveTab] = useState(initialTab === 'commissions' ? 'commissions' : 'mappings');
  const [currentUser] = useState(() => getUser());
  const isOwner = Boolean(currentUser?.capabilities?.is_owner);

  if (!isOwner) {
    return (
      <div className="glass-card" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <ShieldAlert size={32} color="var(--warning)" />
        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Acceso Restringido</h4>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Solo el dueño puede configurar la caja.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary"
          style={{ padding: '8px 16px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)', marginTop: '8px' }}
        >
          Volver
        </button>
      </div>
    );
  }



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--accent)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px'
          }}
        >
          <ArrowLeft size={16} />
          <span>Volver a la caja</span>
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('mappings')}
          style={{
            padding: '8px 14px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            border: activeTab === 'mappings' ? '1px solid var(--accent)' : '1px solid var(--border-glass)',
            background: activeTab === 'mappings' ? 'var(--chip-bg)' : 'transparent',
            color: activeTab === 'mappings' ? 'var(--accent)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Layers size={14} />
          <span>Formas de pago</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('commissions')}
          style={{
            padding: '8px 14px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            border: activeTab === 'commissions' ? '1px solid var(--accent)' : '1px solid var(--border-glass)',
            background: activeTab === 'commissions' ? 'var(--chip-bg)' : 'transparent',
            color: activeTab === 'commissions' ? 'var(--accent)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <CreditCard size={14} />
          <span>Comisiones</span>
        </button>
      </div>

      {activeTab === 'mappings' ? (
        <PaymentMappingsPanel />
      ) : (
        <CommissionRatesPanel />
      )}
    </div>
  );
}
