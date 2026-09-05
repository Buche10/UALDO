import React, { useState } from 'react';
import { Settings, Sliders, Smartphone, Download, Trash2, CheckCircle, Sparkles } from 'lucide-react';

export default function SettingsView({ settings, onSaveSettings, onClearAllData }) {
  const [prompt, setPrompt] = useState(settings.systemPrompt || '');
  const [model, setModel] = useState(settings.activeModel || 'llama3:latest');
  const [webhookUrl, setWebhookUrl] = useState(settings.googleSheetsWebhookUrl || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onSaveSettings({
      systemPrompt: prompt,
      activeModel: model,
      googleSheetsWebhookUrl: webhookUrl
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
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
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 className="section-title" style={{ margin: 0 }}>
          <Settings size={20} color="var(--primary)" />
          <span>Configuración del Gestor UALDO</span>
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Personaliza la inteligencia, prompts y conectividad con Google Sheets.
        </p>
      </div>

      <form onSubmit={handleSave} className="glass-card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Personalidad & Prompt de Sistema</h3>

        <div className="form-group">
          <label className="form-label">Modelo Activo</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="llama3:latest, mistral, qwen2.5..." 
            value={model} 
            onChange={e => setModel(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">URL del Webhook de Google Sheets</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="https://script.google.com/macros/s/AKfycbx.../exec" 
            value={webhookUrl} 
            onChange={e => setWebhookUrl(e.target.value)}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '4px' }}>
            Pega la URL de tu Webhook de Google Apps Script para guardar automáticamente los cierres de caja.
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Instrucciones del Gestor (System Prompt)</label>
          <textarea 
            className="form-input" 
            rows="4"
            style={{ fontFamily: 'var(--font-body)', fontSize: '13px', lineHeight: '1.5', resize: 'vertical' }}
            value={prompt} 
            onChange={e => setPrompt(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          {savedSuccess ? <CheckCircle size={16} /> : <Sliders size={16} />}
          <span>{savedSuccess ? '¡Guardado Correctamente!' : 'Guardar Cambios'}</span>
        </button>
      </form>

      {/* Google Sheets Setup Instructions */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>📄 Script para tu Google Sheets</h3>
          <button
            onClick={handleCopyScript}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid var(--border-glass)',
              color: 'var(--primary)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {copiedScript ? '¡Script Copiado!' : 'Copiar Script'}
          </button>
        </div>

        <ol style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, paddingLeft: '18px', lineHeight: '1.6' }}>
          <li>Abre tu hoja de cálculo en <strong>Google Sheets</strong>.</li>
          <li>Ve a <strong>Extensiones &gt; Apps Script</strong>.</li>
          <li>Pega el código copiado, haz clic en <strong>Desplegar &gt; Nuevo despliegue</strong> (Selecciona <em>Aplicación Web</em> y permiso <em>Cualquier usuario</em>).</li>
          <li>Copia la URL del Webhook generada y pégala en el campo de arriba.</li>
        </ol>
      </div>

      {/* PWA Install Card */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Smartphone size={20} color="var(--secondary)" />
          <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Instalar en el Celular (PWA)</h3>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Abre esta app en el navegador de tu celular (Safari o Chrome), pulsa en el botón <strong>"Compartir / Opciones"</strong> y selecciona <strong>"Añadir a la pantalla de inicio"</strong> para usar UALDO como app nativa.
        </p>
      </div>

      {/* Reset Data */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--error)' }}>Restablecer Ecosistema</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Borra el historial de conversaciones y restablece ajustes.</div>
        </div>

        <button 
          onClick={onClearAllData}
          style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--error)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Trash2 size={14} />
          <span>Restablecer</span>
        </button>
      </div>
    </div>
  );
}
