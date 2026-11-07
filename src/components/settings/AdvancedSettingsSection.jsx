import React, { useState, useRef, useEffect } from 'react';
import { Server, RefreshCw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { checkNodeStatus } from '../../services/aiEngine';

export default function AdvancedSettingsSection({ settings, onSaveSettings, onClearAllData }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(settings?.apiBaseUrl || 'http://ualbusiness.test/api/v1');
  const [provider, setProvider] = useState(settings?.aiProvider || 'motor');
  const [ip, setIp] = useState(settings?.nodeIp || '192.168.1.100');
  const [port, setPort] = useState(settings?.nodePort || '11434');
  const [model, setModel] = useState(settings?.activeModel || 'llama3:latest');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await checkNodeStatus(apiBaseUrl);
    setTestResult(result);
    setTesting(false);
  };

  const handleSaveAdvanced = (e) => {
    e.preventDefault();
    onSaveSettings?.({
      apiBaseUrl,
      aiProvider: provider,
      nodeIp: ip,
      nodePort: port,
      activeModel: model,
    });
    setSavedSuccess(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="glass-card" style={{ padding: '16px' }}>
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: 0,
          color: 'var(--text-main)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={18} color="var(--accent)" />
          <span style={{ fontWeight: 600, fontSize: '14px' }}>Configuración Avanzada & Conexiones</span>
        </div>
        {showAdvanced ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
      </button>

      {showAdvanced && (
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--card-subtle-bg)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>Servidor Ualdo</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{apiBaseUrl}</div>
            </div>
            <button
              type="button"
              className="glass-card-interactive"
              onClick={handleTestConnection}
              disabled={testing}
              style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--primary-tint)', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              <RefreshCw size={12} className={testing ? 'spin' : ''} style={{ verticalAlign: -1, marginRight: 4 }} />
              <span>{testing ? 'Comprobando...' : 'Probar Conexión'}</span>
            </button>
          </div>

          {testResult && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: testResult.online ? 'var(--success-soft)' : 'var(--error-soft)',
                border: `1px solid ${testResult.online ? 'var(--border-success)' : 'var(--border-error)'}`,
                fontSize: '11px',
              }}
            >
              <div style={{ fontWeight: 600, color: testResult.online ? 'var(--success)' : 'var(--error)' }}>
                {testResult.online ? `Conectado (${testResult.latency} ms)` : 'Sin conexion'}
              </div>
            </div>
          )}

          <form onSubmit={handleSaveAdvanced} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Proveedor Principal de IA</label>
              <select className="form-input" value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option value="motor">Servidor Ualdo (API Principal)</option>
                <option value="ollama">Ollama (Servidor Local LAN)</option>
                <option value="lmstudio">LM Studio (Compatible OpenAI)</option>
                <option value="local_web">Simulación Local Off-line</option>
              </select>
            </div>

            {import.meta.env.DEV && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">URL Base de API Ualdo (Solo desarrollo)</label>
                <input type="text" className="form-input" value={apiBaseUrl} onChange={(e) => setApiBaseUrl(e.target.value)} />
              </div>
            )}

            {provider === 'ollama' && (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">IP del Nodo LAN</label>
                  <input type="text" className="form-input" value={ip} onChange={(e) => setIp(e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Puerto</label>
                  <input type="text" className="form-input" value={port} onChange={(e) => setPort(e.target.value)} />
                </div>
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Modelo Activo</label>
              <input type="text" className="form-input" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px' }}>
                {savedSuccess ? 'Guardado' : 'Guardar Ajustes'}
              </button>
            </div>
          </form>

          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '14px' }}>
            <button
              type="button"
              onClick={onClearAllData}
              style={{ width: '100%', padding: '10px', fontSize: '12px', color: 'var(--error)', border: '1px solid var(--border-error)', background: 'var(--error-soft-strong)', cursor: 'pointer', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Trash2 size={14} />
              <span>Restablecer Datos Locales</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
