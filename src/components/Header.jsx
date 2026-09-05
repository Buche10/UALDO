import React from 'react';
import { Cpu, Wifi, Smartphone, RefreshCw } from 'lucide-react';

export default function Header({ nodeStatus, onRefreshStatus, activeTab }) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'chat': return 'IA Conversacional';
      case 'ecosystem': return 'Apps & Servicios Locales';
      case 'network': return 'Nodos & Red Local';
      case 'settings': return 'Configuración';
      default: return 'Ecosistema';
    }
  };

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">
          <Cpu size={22} color="#ffffff" />
        </div>
        <div>
          <h1 className="brand-title">UALDO</h1>
          <div className="brand-sub">{getTabTitle()}</div>
        </div>
      </div>

      <div 
        className="node-status-badge glass-card-interactive" 
        onClick={onRefreshStatus}
        title="Toca para re-escanear nodo local"
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
