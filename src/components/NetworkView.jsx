import React, { useState } from 'react';
import { Network, Server, Shield, RefreshCw, CheckCircle, AlertTriangle, User, LogOut, Building } from 'lucide-react';
import { checkNodeStatus } from '../services/aiEngine';
import { getUser, logout } from '../services/auth';

export default function NetworkView({ settings, onSaveSettings, nodeStatus, onRefreshStatus }) {
  const [apiBaseUrl, setApiBaseUrl] = useState(settings.apiBaseUrl || 'http://ualbusiness.test/api/v1');
  const [provider, setProvider] = useState(settings.aiProvider || 'motor');
  const [ip, setIp] = useState(settings.nodeIp || '192.168.1.100');
  const [port, setPort] = useState(settings.nodePort || '11434');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const currentUser = getUser();

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await checkNodeStatus(ip, port, provider);
    setTestResult(result);
    setTesting(false);

    if (result.online) {
      onSaveSettings({
        apiBaseUrl,
        nodeIp: ip,
        nodePort: port,
        aiProvider: provider,
        activeModel: result.models?.[0] || settings.activeModel
      });
      onRefreshStatus();
    }
  };

  const handleLogoutClick = async () => {
    if (confirm('¿Deseas cerrar sesión en el Motor UaldoBusiness?')) {
      await logout();
      window.location.reload();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 className="section-title" style={{ margin: 0 }}>
          <Network size={20} color="var(--secondary)" />
          <span>Conexión al Motor UaldoBusiness & Red</span>
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Configuración de la API del motor Laravel 12 y estado del nodo de IA.
        </p>
      </div>

      {/* Active User Card */}
      {currentUser && (
        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.12))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px' }}>{currentUser.name} ({currentUser.role})</div>
              <div style={{ fontSize: '12px', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building size={12} />
                <span>{currentUser.business_name || 'Negocio'}</span>
                <span style={{ color: 'var(--text-muted)' }}>({currentUser.email})</span>
              </div>
            </div>
          </div>

          <button
            className="glass-card-interactive"
            onClick={handleLogoutClick}
            style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--error)', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.1)', cursor: 'pointer', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <LogOut size={14} />
            <span>Salir</span>
          </button>
        </div>
      )}

      {/* Status Card */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: nodeStatus.online ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Server size={22} color={nodeStatus.online ? 'var(--success)' : 'var(--error)'} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>
              {nodeStatus.online ? 'Motor API Conectado' : 'Sin Conexión con Motor'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {settings.apiBaseUrl || 'http://ualbusiness.test/api/v1'}
            </div>
          </div>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleTestConnection}
          disabled={testing}
          style={{ padding: '8px 14px', fontSize: '12px' }}
        >
          <RefreshCw size={14} className={testing ? 'spin' : ''} />
          <span>{testing ? 'Verificando...' : 'Probar Red'}</span>
        </button>
      </div>

      {/* Network Config Form */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Parámetros de API & Motor IA</h3>

        <div className="form-group">
          <label className="form-label">Motor Principal de IA</label>
          <select 
            className="form-input" 
            value={provider} 
            onChange={e => setProvider(e.target.value)}
          >
            <option value="motor">UaldoBusiness Motor (Laravel 12 API + Prism)</option>
            <option value="ollama">Ollama (Servidor Local / LAN)</option>
            <option value="lmstudio">LM Studio (OpenAI Compatible Endpoint)</option>
            <option value="local_web">Simulación Local Off-line</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">URL Base de la API UaldoBusiness</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="http://ualbusiness.test/api/v1" 
            value={apiBaseUrl} 
            onChange={e => setApiBaseUrl(e.target.value)}
          />
        </div>

        {provider === 'ollama' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">Dirección IP Ollama (Wi-Fi)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="192.168.1.X" 
                value={ip} 
                onChange={e => setIp(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Puerto</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="11434" 
                value={port} 
                onChange={e => setPort(e.target.value)}
              />
            </div>
          </div>
        )}

        {testResult && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            borderRadius: '12px',
            background: testResult.online ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            border: `1px solid ${testResult.online ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: testResult.online ? 'var(--success)' : 'var(--error)' }}>
              {testResult.online ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              <span>{testResult.online ? '¡Conexión Exitosa!' : 'No se pudo conectar con el motor'}</span>
            </div>

            {testResult.online ? (
              <div style={{ marginTop: '6px', color: 'var(--text-muted)' }}>
                Latencia: <strong>{testResult.latency} ms</strong> | Modelos/Servicios: <strong>{testResult.models.join(', ')}</strong>
              </div>
            ) : (
              <div style={{ marginTop: '6px', color: 'var(--text-muted)' }}>
                {testResult.error || 'Verifica que Laragon/Nginx y Laravel estén corriendo en http://ualbusiness.test.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
