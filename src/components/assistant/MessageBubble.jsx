import React from 'react';
import PendingActionCard from './PendingActionCard';
import ChatCard from './ChatCard';
import MessageAttachments from './MessageAttachments';

export default function MessageBubble({ message, onApprove, onCancel, onQuickReply }) {
  const isUser = message.role === 'user';
  const timeFormatted = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const cards = Array.isArray(message.cards) ? message.cards : [];
  const quickReplies = Array.isArray(message.quickReplies) ? message.quickReplies : [];

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
        {message.content && <div className="message-text">{message.content}</div>}

        {Array.isArray(message.attachments) && message.attachments.length > 0 && (
          <MessageAttachments attachments={message.attachments} />
        )}

        {cards.map((card, index) => (
          <ChatCard key={`card-${index}`} card={card} />
        ))}

        {Array.isArray(message.pendingActions) && message.pendingActions.length > 0 && (
          <div className="pending-actions-list">
            {message.pendingActions.map((action, idx) => (
              <PendingActionCard
                key={action.token || idx}
                action={action}
                onApprove={onApprove}
                onCancel={onCancel}
                disabled={Boolean(message.isHistorical)}
              />
            ))}
          </div>
        )}

        {quickReplies.length > 0 && (
          <div className="chat-quick-replies" role="group" aria-label="Respuestas rápidas">
            {quickReplies.map((text, index) => (
              <button
                key={`${text}-${index}`}
                type="button"
                className="chat-quick-reply-btn"
                onClick={() => onQuickReply?.(message.id, text)}
              >
                {text}
              </button>
            ))}
          </div>
        )}

        {timeFormatted && (
          <div className="message-meta">
            <span>{timeFormatted}</span>
          </div>
        )}
      </div>
    </div>
  );
}
