import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function Header({ nodeStatus, onRefreshStatus, activeTab }) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'trabajo': return 'Ualdo Teams';
      case 'negocios': return 'Ualdo Negocios';
      case 'asistente': return 'Asistente';
      case 'settings': return 'Ajustes';
      default: return 'Ualdo';
    }
  };

  return (
    <header className="app-header">
      <div className="brand-section">
        <img 
          src="/brand/ualdo-claro.png" 
          alt="UALDO" 
          className="brand-logo-img" 
          style={{ height: '32px', width: 'auto' }} 
        />
        <div>
          <div className="brand-sub">{getTabTitle()}</div>
        </div>
      </div>

      <div 
        className="node-status-badge glass-card-interactive" 
        onClick={onRefreshStatus}
        title="Toca para re-escanear estado de red"
      >
        <span className={`status-dot ${nodeStatus.online ? 'online' : 'connecting'}`}></span>
        <span>
          {nodeStatus.online ? `${nodeStatus.latency}ms` : 'Desconectado'}
        </span>
        <RefreshCw size={12} className={nodeStatus.checking ? 'spin' : ''} style={{ color: 'var(--text-muted)' }} />
      </div>
    </header>
  );
}
