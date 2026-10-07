import React from 'react';
import { RefreshCw, Bell } from 'lucide-react';

export default function Header({
  nodeStatus,
  onRefreshStatus,
  activeTab,
  unreadCount = 0,
  onOpenNotifications,
  isAuthenticated = false,
}) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'trabajo': return 'Ualdo Teams';
      case 'negocios': return 'Ualdo Negocios';
      case 'asistente': return 'Asistente';
      case 'settings': return 'Ajustes';
      default: return 'Ualdo';
    }
  };

  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <header className="app-header">
      <div className="brand-section">
        <img 
          src="/brand/ualdo-claro.png" 
          alt="Ualdo" 
          className="brand-logo-img" 
          style={{ height: '32px', width: 'auto' }} 
        />
        <div>
          <div className="brand-sub">{getTabTitle()}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isAuthenticated && (
          <button
            type="button"
            className="glass-card-interactive"
            onClick={onOpenNotifications}
            aria-label={unreadCount > 0 ? `Avisos, ${badgeText} sin leer` : 'Avisos, sin novedades'}
            style={{
              position: 'relative',
              background: 'rgba(32, 45, 47, 0.75)',
              border: '1px solid var(--border-glass)',
              borderRadius: '9999px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main)',
            }}
          >
            <Bell size={18} color="var(--accent)" />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--error)',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  border: '2px solid var(--bg-dark)',
                  lineHeight: 1,
                }}
              >
                {badgeText}
              </span>
            )}
          </button>
        )}

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
      </div>
    </header>
  );
}
