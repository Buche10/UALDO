import React from 'react';
import { ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react';

export default function PurchasingSettingsLoadError({ loadError, onRetry }) {
  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShoppingBag size={18} color="var(--accent)" />
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
          Ajustes de compras y tolerancias
        </h4>
      </div>
      <div role="alert" style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <AlertCircle size={14} />
        <span>{loadError}</span>
      </div>
      <button type="button" onClick={onRetry} className="btn-secondary" style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'var(--surface-soft)', color: 'var(--text-main)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <RefreshCw size={14} />
        <span>Reintentar</span>
      </button>
    </div>
  );
}
