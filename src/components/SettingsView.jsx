import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, User, LogOut, Building, ShieldCheck, 
  ChevronDown, ChevronUp, Server, RefreshCw, Sliders, 
  Trash2, CheckCircle, Smartphone, Info, Sparkles, Bell
} from 'lucide-react';
import { getUser, logout, isAuthenticated } from '../services/auth';
import { checkNodeStatus } from '../services/aiEngine';
import { getPreferences, updatePreferences } from '../services/notificationsClient';

export default function SettingsView({ settings, onSaveSettings, onClearAllData }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const currentUser = getUser();
  const authenticated = isAuthenticated();

  // Notification preferences state
  const [preferences, setPreferences] = useState([]);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [prefsError, setPrefsError] = useState(null);
  const [savingCategory, setSavingCategory] = useState(null);

  // Advanced settings state
  const [apiBaseUrl, setApiBaseUrl] = useState(settings.apiBaseUrl || 'http://ualbusiness.test/api/v1');
  const [provider, setProvider] = useState(settings.aiProvider || 'motor');
  const [ip, setIp] = useState(settings.nodeIp || '192.168.1.100');
  const [port, setPort] = useState(settings.nodePort || '11434');
  const [prompt, setPrompt] = useState(settings.systemPrompt || '');
  const [model, setModel] = useState(settings.activeModel || 'llama3:latest');
  const [webhookUrl, setWebhookUrl] = useState(settings.googleSheetsWebhookUrl || '');
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const saveTimerRef = useRef(null);
  const copyTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!authenticated) {
      setPreferences([]);
      setLoadingPrefs(false);
      return;
    }

    const loadNotificationPrefs = async () => {
      setLoadingPrefs(true);
      setPrefsError(null);
      const res = await getPreferences();
      setLoadingPrefs(false);
      if (res.ok && res.data) {
        let prefsList = [];
        if (Array.isArray(res.data.preferences)) {
          prefsList = res.data.preferences;
        } else if (Array.isArray(res.data)) {
          prefsList = res.data;
        } else if (res.data && typeof res.data === 'object') {
          // Si el servidor o mock devuelve { pedidos: true, ... }
          prefsList = Object.entries(res.data)
            .filter(([k]) => ['pedidos', 'inventario', 'caja', 'sistema'].includes(k))
            .map(([category, enabled]) => ({ category, enabled: Boolean(enabled) }));
        }
        setPreferences(prefsList);
      } else {
        setPrefsError(res.error || 'No se pudieron cargar las preferencias de avisos.');
      }
    };

    loadNotificationPrefs();
  }, [authenticated]);

  const handleTogglePreference = async (category, currentEnabled) => {
    const newEnabled = !currentEnabled;
    // Actualización optimista
    setPreferences(prev => prev.map(p => p.category === category ? { ...p, enabled: newEnabled } : p));
    setSavingCategory(category);
    setPrefsError(null);

    // El motor exige una lista: [{ category, enabled }]
    const res = await updatePreferences([{ category, enabled: newEnabled }]);
    setSavingCategory(null);

    if (res.ok) {
      if (res.data?.preferences && Array.isArray(res.data.preferences)) {
        setPreferences(res.data.preferences);
      }
    } else {
      // Revertir ante error
      setPreferences(prev => prev.map(p => p.category === category ? { ...p, enabled: currentEnabled } : p));
      setPrefsError(res.error || 'Error al actualizar la preferencia.');
    }
  };

  const handleLogoutClick = async () => {
    if (confirm('¿Deseas cerrar sesión en tu cuenta Ualdo?')) {
      await logout();
      window.location.reload();
    }
  };

  const handleSaveAdvanced = (e) => {
    e?.preventDefault();
    onSaveSettings({
      apiBaseUrl,
      nodeIp: ip,
      nodePort: port,
      aiProvider: provider,
      activeModel: model,
      systemPrompt: prompt,
      googleSheetsWebhookUrl: webhookUrl
    });
    setSavedSuccess(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await checkNodeStatus(ip, port, provider);
    setTestResult(result);
    setTesting(false);

    if (result.online) {
      handleSaveAdvanced();
    }
  };

  const scriptSnippet = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.fecha, data.efectivo, data.pichincha, data.deUna, data.internacional,
      data.totalTransferencias, data.tarjeta, data.tarjetaSinComision,
      data.tarjetaDiners, data.tarjetaDinersSinComision, data.totalTarjetasNeto,
      data.propinas, data.totalGastosYConsumos, data.ventasDelDia,
      data.diferenciaEfectivo, data.observacion
    ]);
    return ContentService.createTextOutput(JSON.stringify({result:"success"})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({result:"error", error:err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptSnippet);
    setCopiedScript(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={20} color="var(--accent)" />
          <span>Ajustes</span>
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Configuración de cuenta, apariencia y preferencias del sistema.
        </p>
      </div>

      {/* 1. SECCIÓN CUENTA */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.5px' }}>
          Cuenta
        </h3>

        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{currentUser.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building size={12} />
                  <span>{currentUser.business_name || 'Negocio'}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({currentUser.email})</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogoutClick}
              style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--error)', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.1)', cursor: 'pointer', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <LogOut size={14} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            No hay sesión activa. Ingresa desde el módulo correspondiente.
          </div>
        )}
      </div>

      {/* 2. SECCIÓN AVISOS / NOTIFICACIONES */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Bell size={18} color="var(--accent)" />
          <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, letterSpacing: '0.5px' }}>
            Avisos del Sistema
          </h3>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Controla qué categorías deseas recibir en la app. Los avisos críticos llegan siempre.
        </p>

        {prefsError && (
          <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', fontSize: '12px', marginBottom: '12px' }}>
            {prefsError}
          </div>
        )}

        {!authenticated ? (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Inicia sesión para gestionar tus avisos.
          </div>
        ) : loadingPrefs ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px 0' }}>
            Cargando preferencias de avisos...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {preferences.map((p) => (
              <div
                key={p.category}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(32, 45, 47, 0.5)',
                  border: '1px solid var(--border-glass)',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                    {p.label || p.category}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Avisos de {p.category}
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={p.enabled}
                  aria-label={`${p.enabled ? 'Desactivar' : 'Activar'} avisos de ${p.label || p.category}`}
                  disabled={savingCategory === p.category}
                  onClick={() => handleTogglePreference(p.category, p.enabled)}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '9999px',
                    border: 'none',
                    background: p.enabled ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    padding: '2px',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transform: p.enabled ? 'translateX(20px)' : 'translateX(0)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
              </div>
            ))}

            <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '4px', fontStyle: 'italic' }}>
              Nota: Los avisos críticos de descuadre y seguridad se entregan siempre, independientemente de estos interruptores.
            </div>
          </div>
        )}
      </div>

      {/* 3. SECCIÓN APARIENCIA */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.5px' }}>
          Apariencia
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Tema Visual Oficial</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Teal Oscuro Premium (#1d1d1b / #00737f)</div>
          </div>
          <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(0,115,127,0.2)', border: '1px solid var(--border-glass)', fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>
            Activo
          </span>
        </div>
      </div>

      {/* 4. SECCIÓN ACERCA DE */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.5px' }}>
          Acerca de
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src="/brand/isotipo.png" alt="Isotipo Ualdo" style={{ width: '48px', height: 'auto' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main)' }}>UALDO Mobile</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Versión 1.0.0 (Capacitor Native)</div>
            <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '2px' }}>© 2026 Ualdo Corp. Todos los derechos reservados.</div>
          </div>
        </div>
      </div>

      {/* 5. SECCIÓN AVANZADO (COLAPSADO) */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <button
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
            color: 'var(--text-main)'
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
            
            {/* Status Check Node */}
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Servidor Ualdo</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{apiBaseUrl}</div>
              </div>
              <button
                className="glass-card-interactive"
                onClick={handleTestConnection}
                disabled={testing}
                style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(0,115,127,0.15)', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                <RefreshCw size={12} className={testing ? 'spin' : ''} style={{ verticalAlign: -1, marginRight: 4 }} />
                <span>{testing ? 'Comprobando...' : 'Probar Conexión'}</span>
              </button>
            </div>

            {testResult && (
              <div style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: testResult.online ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                border: `1px solid ${testResult.online ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                fontSize: '11px'
              }}>
                <div style={{ fontWeight: 600, color: testResult.online ? 'var(--success)' : 'var(--error)' }}>
                  {testResult.online ? `Conectado (${testResult.latency} ms)` : 'Sin conexion'}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveAdvanced} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Proveedor Principal de IA</label>
                <select 
                  className="form-input" 
                  value={provider} 
                  onChange={e => setProvider(e.target.value)}
                >
                  <option value="motor">Servidor Ualdo (API Principal)</option>
                  <option value="ollama">Ollama (Servidor Local LAN)</option>
                  <option value="lmstudio">LM Studio (Compatible OpenAI)</option>
                  <option value="local_web">Simulación Local Off-line</option>
                </select>
              </div>

              {import.meta.env.DEV && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">URL Base de API Ualdo (Solo desarrollo)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={apiBaseUrl} 
                    onChange={e => setApiBaseUrl(e.target.value)}
                  />
                </div>
              )}

              {provider === 'ollama' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">IP del Nodo LAN</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={ip} 
                      onChange={e => setIp(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Puerto</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={port} 
                      onChange={e => setPort(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Modelo Activo</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={model} 
                  onChange={e => setModel(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Webhook de Google Sheets (Cierre de Caja)</label>
                <input 
                  type="url" 
                  className="form-input" 
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={webhookUrl} 
                  onChange={e => setWebhookUrl(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px' }}>
                  {savedSuccess ? 'Guardado' : 'Guardar Ajustes'}
                </button>
              </div>
            </form>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '14px' }}>
              <button
                onClick={onClearAllData}
                style={{ width: '100%', padding: '10px', fontSize: '12px', color: 'var(--error)', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.1)', cursor: 'pointer', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Trash2 size={14} />
                <span>Restablecer Datos Locales</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
