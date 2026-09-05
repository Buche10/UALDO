import React, { useState } from 'react';
import { 
  Activity, CheckSquare, Terminal, Zap, Database, 
  Plus, Play, Server, Shield, Globe, Cpu, Check, AlertCircle 
} from 'lucide-react';
import { executeLocalTool, registerApp } from '../services/appEcosystem';
import DobleFiloCard from './DobleFiloCard';

const ICON_MAP = {
  Activity,
  CheckSquare,
  Terminal,
  Zap,
  Database
};

export default function EcosystemView({ registeredApps, onUpdateApps, onSendChatPrompt }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppCategory, setNewAppCategory] = useState('Automatización');
  const [newAppDesc, setNewAppDesc] = useState('');
  const [newAppEndpoint, setNewAppEndpoint] = useState('http://localhost:8000/api');
  const [executionResult, setExecutionResult] = useState(null);

  const handleTestTool = async (app) => {
    const defaultTool = app.tools?.[0]?.name || 'get_system_status';
    setExecutionResult({ appId: app.id, status: 'running', toolName: defaultTool });
    
    const result = await executeLocalTool(defaultTool);
    setExecutionResult({ appId: app.id, status: 'done', toolName: defaultTool, data: result });
  };

  const handleCreateApp = (e) => {
    e.preventDefault();
    if (!newAppName.trim()) return;

    const newApp = {
      name: newAppName,
      category: newAppCategory,
      description: newAppDesc || 'Aplicación local personalizada conectada a UALDO.',
      endpoint: newAppEndpoint,
      icon: 'Zap',
      tools: [
        {
          name: `custom_action_${Date.now()}`,
          description: `Disparar endpoint en ${newAppEndpoint}`,
          parameters: {}
        }
      ]
    };

    const updated = registerApp(newApp);
    onUpdateApps(updated);
    setShowAddModal(false);
    setNewAppName('');
    setNewAppDesc('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>Ecosistema de Apps Locales</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Aplicaciones y conectores gestionados activamente por UALDO.
          </p>
        </div>

        <button 
          className="btn-primary" 
          onClick={() => setShowAddModal(true)}
          style={{ padding: '8px 14px', fontSize: '12px' }}
        >
          <Plus size={16} />
          <span>Añadir App</span>
        </button>
      </div>

      {/* DOBLEFILO Dedicated Widget */}
      <DobleFiloCard onSendChatPrompt={onSendChatPrompt} />

      {/* Grid of Other Apps */}
      <div className="ecosystem-grid">
        {registeredApps.map((app) => {
          const IconComponent = ICON_MAP[app.icon] || Zap;
          const isResultThisApp = executionResult?.appId === app.id;

          return (
            <div key={app.id} className="glass-card app-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="app-card-icon">
                  <IconComponent size={22} />
                </div>
                <span className="app-badge active">
                  {app.status.toUpperCase()}
                </span>
              </div>

              <div>
                <h3 className="app-card-title">{app.name}</h3>
                <span style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: 600 }}>
                  {app.category}
                </span>
                <p className="app-card-desc" style={{ marginTop: '4px' }}>
                  {app.description}
                </p>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
                  {app.endpoint}
                </div>

                <button 
                  className="glass-card-interactive"
                  onClick={() => handleTestTool(app)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-glass)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-main)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Play size={12} color="var(--primary)" />
                  <span>Ejecutar Prueba</span>
                </button>

                {isResultThisApp && (
                  <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>
                    {executionResult.status === 'running' ? 'Ejecutando...' : '✓ Acción comprobada'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Local App */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '20px' }}>
            <h3 className="section-title">Registrar Nueva App / Microservicio</h3>
            
            <form onSubmit={handleCreateApp}>
              <div className="form-group">
                <label className="form-label">Nombre de la App Local</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="ej. Servidor de Automatizaciones" 
                  value={newAppName} 
                  onChange={e => setNewAppName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select 
                  className="form-input"
                  value={newAppCategory}
                  onChange={e => setNewAppCategory(e.target.value)}
                >
                  <option value="Productividad">Productividad</option>
                  <option value="Automatización">Automatización</option>
                  <option value="Infraestructura">Infraestructura</option>
                  <option value="IoT">IoT / Domótica</option>
                  <option value="Almacenamiento">Almacenamiento</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Endpoint HTTP / Canal Local</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="http://192.168.1.50:8000/api" 
                  value={newAppEndpoint} 
                  onChange={e => setNewAppEndpoint(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Propósito de esta app..." 
                  value={newAppDesc} 
                  onChange={e => setNewAppDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Registrar en UALDO
                </button>
                <button 
                  type="button" 
                  className="glass-card" 
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '10px 16px', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
