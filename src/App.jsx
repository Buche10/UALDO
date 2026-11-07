import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import AssistantChat from './components/assistant/AssistantChat';
import MasView from './components/MasView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import ChangePasswordView from './components/ChangePasswordView';
import NotificationsPanel from './components/notifications/NotificationsPanel';

import { getSettings, saveSettings } from './services/storage';
import { getRegisteredApps, saveRegisteredApps } from './services/appEcosystem';
import { isAuthenticated, fetchMe, getUser, logout } from './services/auth';
import { UNAUTHORIZED_SESSION_MESSAGE, PASSWORD_CHANGE_REQUIRED_EVENT } from './services/apiClient';
import { useUnreadCount } from './hooks/useUnreadCount';

export default function App() {
  const [activeTab, setActiveTab] = useState('ualdo');
  const [negociosSubView, setNegociosSubView] = useState('overview');
  const [negociosParams, setNegociosParams] = useState(null);
  // Cada navegación desde un aviso lleva un número propio: el mismo aviso
  // tocado dos veces vuelve a abrir (y recargar) su pantalla (Brief 22p).
  const navSequenceRef = useRef(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [settings, setSettings] = useState(getSettings);
  const [registeredApps, setRegisteredApps] = useState(getRegisteredApps);
  
  const [user, setUser] = useState(getUser);
  const [authenticated, setAuthenticated] = useState(isAuthenticated);
  const [authChecking, setAuthChecking] = useState(true);
  const [sessionNotice, setSessionNotice] = useState(null);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);

  const { unreadCount, refreshUnreadCount } = useUnreadCount({
    enabled: authenticated,
  });

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

    const handleUnauthorized = (event) => {
      setAuthenticated(false);
      setUser(null);
      setSessionNotice(event?.detail?.message || UNAUTHORIZED_SESSION_MESSAGE);
    };

    const handlePasswordChangeRequired = () => {
      setForcePasswordChange(true);
    };

    window.addEventListener('ualdo:unauthorized', handleUnauthorized);
    window.addEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, handlePasswordChangeRequired);
    return () => {
      window.removeEventListener('ualdo:unauthorized', handleUnauthorized);
      window.removeEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, handlePasswordChangeRequired);
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setAuthenticated(true);
    setSessionNotice(null);
    setForcePasswordChange(Boolean(userData?.must_change_password));
    refreshUnreadCount();
  };

  const handlePasswordChanged = async () => {
    const refreshed = await fetchMe();
    if (refreshed) {
      setUser(refreshed);
    } else {
      setUser((prev) => (prev ? { ...prev, must_change_password: false } : prev));
    }
    setForcePasswordChange(false);
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      setUser(null);
      setAuthenticated(false);
      setForcePasswordChange(false);
      setSessionNotice(null);
    }
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
    const legacyTabs = { negocios: 'mas', asistente: 'ualdo' };
    if (target.tab) {
      setActiveTab(legacyTabs[target.tab] || target.tab);
    }
    if (target.subView) {
      setNegociosSubView(target.subView);
    }
    navSequenceRef.current += 1;
    setNegociosParams({ ...(target.params || {}), nav: navSequenceRef.current });
    setShowNotifications(false);
  };

  const handleNegociosSubViewChange = (newSubView, params = null) => {
    setNegociosSubView(newSubView);

    if (params) {
      navSequenceRef.current += 1;
      setNegociosParams({ ...(params || {}), nav: navSequenceRef.current });
      return;
    }

    if (newSubView !== 'cashclose') {
      setNegociosParams(null);
    }
  };

  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', color: 'var(--text-muted)', fontSize: '13px' }}>
        Iniciando UALDO Mobile...
      </div>
    );
  }

  if (authenticated && (user?.must_change_password === true || forcePasswordChange)) {
    return (
      <ChangePasswordView
        forced
        fullScreen
        onSuccess={handlePasswordChanged}
        onLogout={handleSignOut}
      />
    );
  }

  return (
    <div id="root">
      <Header 
        activeTab={activeTab} 
        unreadCount={unreadCount}
        onOpenNotifications={() => setShowNotifications(true)}
        isAuthenticated={authenticated}
        user={user}
      />

      <main className="view-container">
        {/* Pestaña 1: Ualdo (chat, pantalla de inicio) */}
        {activeTab === 'ualdo' && (
          authenticated ? (
            <AssistantChat user={user} />
          ) : (
            <LoginView onLoginSuccess={handleLoginSuccess} notice={sessionNotice} />
          )
        )}

        {/* Pestaña 2: Más (módulos de Negocios y acceso a Ualdo Teams) */}
        {activeTab === 'mas' && (
          authenticated ? (
            <MasView
              registeredApps={registeredApps}
              onUpdateApps={setRegisteredApps}
              onSendChatPrompt={() => setActiveTab('ualdo')}
              subView={negociosSubView}
              onSubViewChange={handleNegociosSubViewChange}
              negociosParams={negociosParams}
              onParamsConsumed={() => setNegociosParams(null)}
            />
          ) : (
            <LoginView onLoginSuccess={handleLoginSuccess} notice={sessionNotice} />
          )
        )}

        {/* Pestaña 3: Ajustes (Perfil, Tema, Acerca de & Avanzado) */}
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