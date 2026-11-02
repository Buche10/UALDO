import React, { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import SuggestionChips from './SuggestionChips';
import PrivacyNotice from './PrivacyNotice';
import ChatComposer from './ChatComposer';
import { useAssistantConversation } from './useAssistantConversation';
import '../../styles/assistant.css';

export default function AssistantChat({ user }) {
  const {
    userId,
    messages,
    inputText,
    setInputText,
    loading,
    errorBanner,
    handleSend,
    handleQuickReply,
    handleApprove,
    handleCancel,
  } = useAssistantConversation(user);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const retry = () => {
    handleSend(errorBanner.failedText, errorBanner.failedAttachments || []);
  };

  return (
    <div className="assistant-container">
      <PrivacyNotice userId={userId} />

      <div className="assistant-messages-area" role="log" aria-label="Historial de mensajes">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onApprove={handleApprove}
            onCancel={handleCancel}
            onQuickReply={handleQuickReply}
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
          <button type="button" className="error-retry-btn" onClick={retry}>
            Reintentar
          </button>
        </div>
      )}

      <SuggestionChips
        user={user}
        disabled={loading}
        onSelectChip={(prompt) => handleSend(prompt)}
      />

      <ChatComposer
        inputText={inputText}
        setInputText={setInputText}
        loading={loading}
        onSend={handleSend}
      />
    </div>
  );
}
