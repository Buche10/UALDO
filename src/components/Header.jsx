import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Bell } from 'lucide-react';
import { getUser } from '../services/auth';
import { roleLabel } from '../services/permissions';
import { checkMotorHealth } from '../services/aiEngine';

const HEALTH_REFRESH_MS = 60000;

const STATUS_VIEW = {
  checking: { label: 'Comprobando conexión', dot: 'connecting' },
  ok: { label: 'Conectado', dot: 'online' },
  issues: { label: 'Motor con problemas', dot: 'warning' },
  offline: { label: 'Sin conexión', dot: 'offline' },
};

export default function Header({
  activeTab,
  unreadCount = 0,
  onOpenNotifications,
  isAuthenticated = false,
  user = null,
}) {
  const [health, setHealth] = useState({ state: 'checking', latency: 0 });

  const refreshHealth = useCallback(async () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    setHealth((prev) => ({ ...prev, state: prev.state === 'ok' ? 'ok' : 'checking' }));
    const result = await checkMotorHealth();
    setHealth({ state: result.status, latency: result.latency || 0 });
  }, []);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') refreshHealth();
    }, HEALTH_REFRESH_MS);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshHealth();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshHealth]);

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
  const currentUser = user || (isAuthenticated ? getUser() : null);
  const label = currentUser ? roleLabel(currentUser) : null;
  const statusView = STATUS_VIEW[health.state] || STATUS_VIEW.checking;

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
          {isAuthenticated && currentUser?.name && (
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, marginTop: '2px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)' }}>
                {currentUser.name}
              </span>
              {label && (
                <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 500 }}>
                  {label}
                </span>
              )}
            </div>
          )}
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
              background: 'var(--bg-card)',
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
            <Bell size={18} color="var(--accent)" aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--error)',
                  color: 'var(--on-primary)',
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

        <button
          type="button"
          className="node-status-badge glass-card-interactive"
          onClick={refreshHealth}
          title="Toca para comprobar la conexión con el motor"
          aria-label={`Estado del motor: ${statusView.label}`}
        >
          <span className={`status-dot ${statusView.dot}`} aria-hidden="true"></span>
          <span aria-live="polite">{statusView.label}</span>
          {health.state === 'ok' && (
            <span style={{ color: 'var(--text-muted)' }}>{health.latency} ms</span>
          )}
          <RefreshCw
            size={12}
            className={health.state === 'checking' ? 'spin' : ''}
            style={{ color: 'var(--text-muted)' }}
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  );
}
