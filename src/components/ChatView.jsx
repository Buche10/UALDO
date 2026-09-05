import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Sparkles, Terminal, CheckCircle2, XCircle, Trash2, Cpu, ShieldAlert, Loader2 } from 'lucide-react';
import { sendChatMessage } from '../services/aiEngine';
import { request } from '../services/apiClient';
import DobleFiloCashCloseCard from './DobleFiloCashCloseCard';

export default function ChatView({
  conversation,
  onUpdateMessages,
  onClearChat,
  settings,
  nodeStatus
}) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages, isSending, actionLoading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || isSending) return;

    const userMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    const updatedMessages = [...conversation.messages, userMessage];
    onUpdateMessages(updatedMessages);
    setInputText('');
    setIsSending(true);

    try {
      const response = await sendChatMessage({
        messages: updatedMessages,
        settings,
        onToolCalled: (toolName, params, result) => {
          console.log('Herramienta ejecutada por UALDO:', toolName, result);
        }
      });

      const assistantMessage = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        pendingAction: response.pendingAction,
        toolExecuted: response.toolExecuted,
        timestamp: Date.now()
      };

      onUpdateMessages([...updatedMessages, assistantMessage]);
    } catch (e) {
      const errorMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error de comunicación con UALDO Motor: ${e.message}`,
        timestamp: Date.now()
      };
      onUpdateMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleApproveAction = async (msgId, pendingAction) => {
    setActionLoading(prev => ({ ...prev, [msgId]: 'approve' }));
    try {
      const res = await request('/admin/chat/approve', {
        method: 'POST',
        body: { token: pendingAction.token }
      });

      const outcomeText = res.ok
        ? `\n\n✅ **Acción Aprobada**: ${res.data?.result || res.data?.message || 'Acción ejecutada en el motor.'}`
        : `\n\n❌ **Error al Aprobar**: ${res.error || 'No se pudo procesar la acción.'}`;

      const updated = conversation.messages.map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            content: m.content + outcomeText,
            pendingAction: null
          };
        }
        return m;
      });

      onUpdateMessages(updated);
    } catch (e) {
      alert(`Error al aprobar: ${e.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [msgId]: null }));
    }
  };

  const handleCancelAction = async (msgId, pendingAction) => {
    setActionLoading(prev => ({ ...prev, [msgId]: 'cancel' }));
    try {
      const res = await request('/admin/chat/cancel', {
        method: 'POST',
        body: { token: pendingAction.token }
      });

      const outcomeText = res.ok
        ? `\n\n🚫 **Acción Cancelada**: ${res.data?.message || 'Cancelada por el usuario.'}`
        : `\n\n⚠️ **Error al Cancelar**: ${res.error || 'No se pudo cancelar.'}`;

      const updated = conversation.messages.map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            content: m.content + outcomeText,
            pendingAction: null
          };
        }
        return m;
      });

      onUpdateMessages(updated);
    } catch (e) {
      alert(`Error al cancelar: ${e.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [msgId]: null }));
    }
  };

  const handleSpeechInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador o dispositivo no soporta la API de Reconocimiento de Voz.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
    };

    recognition.start();
  };

  const quickPills = [
    { label: '📊 Consultar Inventario Real', prompt: 'Dime el estado del inventario actual en el restaurante' },
    { label: '🏷️ Actualizar Precio Item', prompt: 'Cambia el precio de la Hamburguesa a $7.50' },
    { label: '🗑️ Eliminar Item Inventario', prompt: 'Elimina el item de inventario Pizza Especial' },
    { label: '⏰ Horario Comercial', prompt: 'Cambia el horario de atención de 08:00 a 22:00' }
  ];

  return (
    <div className="chat-container">
      <div className="model-selector-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--primary)" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Proveedor IA:</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--secondary)' }}>
            {!settings.aiProvider || settings.aiProvider === 'motor' ? 'UaldoBusiness Motor (IA Real + Prism)' : settings.aiProvider === 'ollama' ? `Ollama (${settings.activeModel})` : 'Simulación Local'}
          </span>
        </div>

        <button 
          onClick={onClearChat}
          style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
          title="Limpiar chat"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="messages-list">
        {conversation.messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble ${msg.role}`}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>

            {/* Pending Action Approval Card */}
            {msg.pendingAction && (
              <div className="tool-invocation-card" style={{
                marginTop: '12px',
                padding: '14px',
                borderRadius: '14px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--secondary)', fontSize: '13px', marginBottom: '6px' }}>
                  <ShieldAlert size={18} color="var(--warning)" />
                  <span>Aprobación Humana Requerida</span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {msg.pendingAction.description || `La acción '${msg.pendingAction.action}' requiere tu confirmación antes de aplicarse en la base de datos.`}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleApproveAction(msg.id, msg.pendingAction)}
                    disabled={Boolean(actionLoading[msg.id])}
                    className="btn-primary"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      borderRadius: '10px'
                    }}
                  >
                    {actionLoading[msg.id] === 'approve' ? (
                      <Loader2 size={14} className="spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    <span>Aprobar</span>
                  </button>

                  <button
                    onClick={() => handleCancelAction(msg.id, msg.pendingAction)}
                    disabled={Boolean(actionLoading[msg.id])}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: 'rgba(244, 63, 94, 0.15)',
                      border: '1px solid rgba(244, 63, 94, 0.4)',
                      color: 'var(--error)',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    {actionLoading[msg.id] === 'cancel' ? (
                      <Loader2 size={14} className="spin" />
                    ) : (
                      <XCircle size={14} />
                    )}
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            )}

            {msg.toolExecuted && (
              <>
                {msg.toolExecuted.closeDetails ? (
                  <DobleFiloCashCloseCard closeDetails={msg.toolExecuted.closeDetails} />
                ) : (
                  <div className="tool-invocation-card">
                    <div className="tool-invocation-header">
                      <Terminal size={14} />
                      <span>Acción Ejecutada</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                      {JSON.stringify(msg.toolExecuted.orderDetails || msg.toolExecuted.resumen || msg.toolExecuted.details || msg.toolExecuted.totals || msg.toolExecuted.summary || msg.toolExecuted.message, null, 2)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {isSending && (
          <div className="chat-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} className="spin" color="var(--primary)" />
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Ualdo Motor procesando consulta...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '8px 0 4px 0' }}>
        {quickPills.map((pill, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(pill.prompt)}
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-muted)',
              fontSize: '11.5px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="chat-input-wrapper">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="chat-input-box">
          <button 
            type="button" 
            className={`btn-icon ${isListening ? 'listening' : ''}`} 
            onClick={handleSpeechInput}
            title="Hablar por micrófono"
            style={isListening ? { color: 'var(--error)', animation: 'pulse 1s infinite' } : {}}
          >
            <Mic size={18} />
          </button>

          <input
            type="text"
            className="chat-input"
            placeholder="Habla con Ualdo para consultar inventario, pedir cambios de precio..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <button type="submit" className="btn-icon btn-send" disabled={!inputText.trim() || isSending}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
