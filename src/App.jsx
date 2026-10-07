import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import AssistantChat from './components/assistant/AssistantChat';
import EcosystemView from './components/EcosystemView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import TrabajoView from './components/TrabajoView';
import NotificationsPanel from './components/notifications/NotificationsPanel';

import { getSettings, saveSettings } from './services/storage';
import { getRegisteredApps, saveRegisteredApps } from './services/appEcosystem';
import { checkNodeStatus } from './services/aiEngine';
import { isAuthenticated, fetchMe, getUser } from './services/auth';
import { useUnreadCount } from './hooks/useUnreadCount';

export default function App() {
  const [activeTab, setActiveTab] = useState('trabajo');
  const [negociosSubView, setNegociosSubView] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [settings, setSettings] = useState(getSettings);
  const [registeredApps, setRegisteredApps] = useState(getRegisteredApps);
  
  const [user, setUser] = useState(getUser);
  const [authenticated, setAuthenticated] = useState(isAuthenticated);
  const [authChecking, setAuthChecking] = useState(true);

  const { unreadCount, refreshUnreadCount } = useUnreadCount({
    enabled: authenticated,
  });

  const [nodeStatus, setNodeStatus] = useState({
    online: false,
    latency: 0,
    checking: false
  });

  const checkConnection = async () => {
    setNodeStatus(prev => ({ ...prev, checking: true }));
    const status = await checkNodeStatus(settings.nodeIp, settings.nodePort, settings.aiProvider);
    setNodeStatus({
      online: status.online,
      latency: status.latency || 12,
      checking: false
    });
  };

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        const currentUser = await fetchMe();
        if (currentUser) {
          setUser(currentUser);
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          setUser(null);
        }
      } else {
        setAuthenticated(false);
        setUser(null);
      }
      setAuthChecking(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      setAuthenticated(false);
      setUser(null);
    };

    window.addEventListener('ualdo:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('ualdo:unauthorized', handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    checkConnection();
  }, [settings.nodeIp, settings.nodePort, settings.aiProvider, authenticated]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setAuthenticated(true);
    checkConnection();
    refreshUnreadCount();
  };

  const handleSaveSettings = (newSettings) => {
    const updated = saveSettings(newSettings);
    setSettings(updated);
  };

  const handleClearAllData = () => {
    if (confirm('¿Estás seguro de que deseas restablecer todos los datos locales?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleNotificationNavigate = (target) => {
    if (!target) return;
    if (target.tab) {
      setActiveTab(target.tab);
    }
    if (target.subView) {
      setNegociosSubView(target.subView);
    }
    setShowNotifications(false);
  };

  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', color: 'var(--text-muted)', fontSize: '13px' }}>
        Iniciando UALDO Mobile...
      </div>
    );
  }

  return (
    <div id="root">
      <Header 
        nodeStatus={nodeStatus} 
        onRefreshStatus={checkConnection} 
        activeTab={activeTab} 
        unreadCount={unreadCount}
        onOpenNotifications={() => setShowNotifications(true)}
        isAuthenticated={authenticated}
      />

      <main className="view-container">
        {/* Pestaña 1: Trabajo (Ualdo Teams) */}
        {activeTab === 'trabajo' && (
          authenticated ? (
            <TrabajoView onLogout={() => { setAuthenticated(false); setUser(null); }} />
          ) : (
            <LoginView onLoginSuccess={handleLoginSuccess} />
          )
        )}

        {/* Pestaña 2: Negocios (Ualdo Negocios / DobleFilo) */}
        {activeTab === 'negocios' && (
          authenticated ? (
            <EcosystemView
              registeredApps={registeredApps}
              onUpdateApps={setRegisteredApps}
              onSendChatPrompt={() => {
                setActiveTab('asistente');
              }}
              subView={negociosSubView}
              onSubViewChange={setNegociosSubView}
            />
          ) : (
            <LoginView onLoginSuccess={handleLoginSuccess} />
          )
        )}

        {/* Pestaña 3: Asistente (Chat Conversacional) */}
        {activeTab === 'asistente' && (
          authenticated ? (
            <AssistantChat user={user} />
          ) : (
            <LoginView onLoginSuccess={handleLoginSuccess} />
          )
        )}

        {/* Pestaña 4: Ajustes (Perfil, Tema, Acerca de & Avanzado) */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onClearAllData={handleClearAllData}
          />
        )}
      </main>

      {showNotifications && (
        <NotificationsPanel
          onClose={() => {
            setShowNotifications(false);
            refreshUnreadCount();
          }}
          onNavigate={handleNotificationNavigate}
        />
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}