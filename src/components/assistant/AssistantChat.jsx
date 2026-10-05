import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, AlertCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import SuggestionChips from './SuggestionChips';
import PrivacyNotice from './PrivacyNotice';
import { useAssistantConversation } from './useAssistantConversation';
import '../../styles/assistant.css';

export default function AssistantChat({ user }) {
  const {
    userId,
    userRole,
    messages,
    inputText,
    setInputText,
    loading,
    errorBanner,
    handleSend,
    handleApprove,
    handleCancel,
    handleKeyDown
  } = useAssistantConversation(user);

  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  const isSpeechSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (e) {}
    };
  }, [isSpeechSupported, setInputText]);

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
              <span className="typing-text">Pensando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {errorBanner && (
        <div className="assistant-error-banner" role="alert">
          <div className="assistant-error-content">
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
