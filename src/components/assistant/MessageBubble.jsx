import React from 'react';
import PendingActionCard from './PendingActionCard';

export default function MessageBubble({ message, onApprove, onCancel }) {
  const isUser = message.role === 'user';
  const timeFormatted = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
        <div className="message-text">
          {message.content}
        </div>

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

        {timeFormatted && (
          <div className="message-meta">
            <span>{timeFormatted}</span>
          </div>
        )}
      </div>
    </div>
  );
}
