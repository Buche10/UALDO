import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import ChatView from './components/ChatView';
import EcosystemView from './components/EcosystemView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import TrabajoView from './components/TrabajoView';

import { getSettings, saveSettings, getConversations, saveConversations } from './services/storage';
import { getRegisteredApps, saveRegisteredApps } from './services/appEcosystem';
import { checkNodeStatus } from './services/aiEngine';
import { isAuthenticated, fetchMe, getUser } from './services/auth';
import { setTeamsToken } from './services/teamsClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('trabajo');
  const [settings, setSettings] = useState(getSettings);
  const [conversations, setConversations] = useState(getConversations);
  const [registeredApps, setRegisteredApps] = useState(getRegisteredApps);
  
  const [user, setUser] = useState(getUser);
  const [authenticated, setAuthenticated] = useState(isAuthenticated);
  const [authChecking, setAuthChecking] = useState(true);

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

  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    setAuthenticated(true);
    if (token) {
      setTeamsToken(token);
    }
    checkConnection();
  };

  const handleSaveSettings = (newSettings) => {
    const updated = saveSettings(newSettings);
    setSettings(updated);
  };

  const handleUpdateMessages = (messages) => {
    const updatedConv = conversations.map(c => c.id === 'default' ? { ...c, messages } : c);
    setConversations(updatedConv);
    saveConversations(updatedConv);
  };

  const handleClearChat = () => {
    if (confirm('¿Deseas reiniciar la conversación con UALDO?')) {
      const initialMessage = [
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: 'Chat reiniciado. ¿En qué te puedo asistir hoy con tus tareas o tu negocio?',
          timestamp: Date.now()
        }
      ];
      handleUpdateMessages(initialMessage);
    }
  };

  const handleClearAllData = () => {
    if (confirm('¿Estás seguro de que deseas restablecer todos los datos locales?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', color: 'var(--text-muted)', fontSize: '13px' }}>
        Iniciando UALDO Mobile...
      </div>
    );
  }

  const currentConversation = conversations.find(c => c.id === 'default') || conversations[0];

  return (
    <div id="root">
      <Header 
        nodeStatus={nodeStatus} 
        onRefreshStatus={checkConnection} 
        activeTab={activeTab} 
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
              onSendChatPrompt={(prompt) => {
                setActiveTab('asistente');
              }}
            />
          ) : (
            <LoginView onLoginSuccess={handleLoginSuccess} />
          )
        )}

        {/* Pestaña 3: Asistente (Chat Conversacional) */}
        {activeTab === 'asistente' && (
          authenticated ? (
            <ChatView
              conversation={currentConversation}
              onUpdateMessages={handleUpdateMessages}
              onClearChat={handleClearChat}
              settings={settings}
              nodeStatus={nodeStatus}
            />
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

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}