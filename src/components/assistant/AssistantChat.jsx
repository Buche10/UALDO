import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, AlertCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import SuggestionChips from './SuggestionChips';
import PrivacyNotice from './PrivacyNotice';
import { sendMessage, approveAction, cancelAction } from '../../services/assistantClient';
import '../../styles/assistant.css';

const MAX_CACHED_MESSAGES = 50;

export default function AssistantChat({ user }) {
  const userId = user?.id || 'default';
  const userRole = user?.role || 'staff';
  const chatStorageKey = `ualdo_chat_${userId}`;

  const [messages, setMessages] = useState(() => {
    try {
      const cached = localStorage.getItem(chatStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Mark pending actions in cached messages as historical / non-actionable
        return parsed.map(msg => ({
          ...msg,
          isHistorical: true,
          pendingActions: Array.isArray(msg.pendingActions)
            ? msg.pendingActions.map(act => ({
                ...act,
                status: act.status && act.status !== 'pending' ? act.status : 'expired'
              }))
            : []
        }));
      }
    } catch (e) {}

    return [
      {
        id: 'msg_welcome',
        role: 'assistant',
        content: `Hola ${user?.name ? user.name.split(' ')[0] : ''}. Soy el asistente del restaurante. ¿En qué puedo ayudarte hoy?`.trim(),
        timestamp: Date.now()
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // Web Speech API availability
  const isSpeechSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    try {
      const sliceToSave = messages.slice(-MAX_CACHED_MESSAGES);
      localStorage.setItem(chatStorageKey, JSON.stringify(sliceToSave));
    } catch (e) {}
  }, [messages, chatStorageKey]);

  useEffect(() => {
    if (!isSpeechSupported) return;
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechClass();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'es-EC';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => (prev ? `${prev} ${transcript}` : transcript).slice(0, 1000));
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (e) {}
    };
  }, [isSpeechSupported]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        setIsRecording(false);
      }
    }
  };

  const handleSend = async (textToSend) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text || loading) return;

    setErrorBanner(null);
    setInputText('');

    const userMsg = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const response = await sendMessage(text);
    setLoading(false);

    if (response.ok) {
      const assistantMsg = {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        pendingActions: response.pendingActions || [],
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } else {
      setErrorBanner({
        message: response.message || 'No se pudo conectar con el asistente.',
        failedText: text
      });
    }
  };

  const handleApprove = async (token) => {
    const res = await approveAction(token);
    setMessages(prev => prev.map(msg => {
      if (!Array.isArray(msg.pendingActions)) return msg;
      const updatedActions = msg.pendingActions.map(action => {
        if (action.token === token) {
          return {
            ...action,
            status: res.ok ? 'done' : 'error',
            result: res.result || res.message,
            error: !res.ok ? (res.message || 'Error al aprobar') : null
          };
        }
        return action;
      });
      return { ...msg, pendingActions: updatedActions };
    }));
  };

  const handleCancel = async (token) => {
    const res = await cancelAction(token);
    setMessages(prev => prev.map(msg => {
      if (!Array.isArray(msg.pendingActions)) return msg;
      const updatedActions = msg.pendingActions.map(action => {
        if (action.token === token) {
          return {
            ...action,
            status: res.ok ? 'cancelled' : 'error',
            result: res.ok ? (res.message || 'Acción cancelada') : null,
            error: !res.ok ? (res.message || 'Error al cancelar') : null
          };
        }
        return action;
      });
      return { ...msg, pendingActions: updatedActions };
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="assistant-container">
      <PrivacyNotice userId={userId} />

      <div className="assistant-messages-area" role="log" aria-label="Historial de mensajes">
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onApprove={handleApprove}
            onCancel={handleCancel}
          />
        ))}

        {loading && (
          <div className="message-row assistant">
            <div className="assistant-typing-indicator" aria-label="El asistente está respondiendo">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span style={{ marginLeft: 6 }}>Pensando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {errorBanner && (
        <div className="assistant-error-banner" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} aria-hidden="true" />
            <span>{errorBanner.message}</span>
          </div>
          <button
            type="button"
            className="error-retry-btn"
            onClick={() => handleSend(errorBanner.failedText)}
          >
            Reintentar
          </button>
        </div>
      )}

      <SuggestionChips
        role={userRole}
        disabled={loading}
        onSelectChip={(prompt) => handleSend(prompt)}
      />

      <div className="assistant-input-container">
        {inputText.length >= 900 && (
          <div className="input-char-counter">
            {1000 - inputText.length} caracteres restantes
          </div>
        )}

        <div className="input-row">
          <textarea
            ref={textareaRef}
            className="assistant-textarea"
            rows={1}
            maxLength={1000}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje al asistente..."
            disabled={loading}
            aria-label="Mensaje para el asistente"
          />

          {isSpeechSupported && (
            <button
              type="button"
              className={`assistant-icon-btn ${isRecording ? 'recording' : ''}`}
              onClick={toggleRecording}
              aria-label={isRecording ? 'Detener grabación de voz' : 'Grabar mensaje de voz'}
              disabled={loading}
            >
              <Mic size={20} aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            className="assistant-send-btn"
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading}
            aria-label="Enviar mensaje"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
