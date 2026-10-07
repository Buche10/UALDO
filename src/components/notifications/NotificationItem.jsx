import React from 'react';

/**
 * Formatea una fecha ISO a texto relativo en español ("hace 5 min").
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'hace un momento';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `hace ${diffDays} d`;
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
}

export function getPriorityStyle(priority) {
  if (priority === 'critical') {
    return {
      borderLeft: '4px solid var(--error)',
      background: 'var(--error-soft)',
    };
  }
  if (priority === 'warning') {
    return {
      borderLeft: '4px solid var(--warning)',
      background: 'var(--warning-soft)',
    };
  }
  return {
    borderLeft: '4px solid var(--primary-2)',
    background: 'var(--bg-card)',
  };
}

export function getPriorityBadge(priority) {
  if (priority === 'critical') {
    return { label: 'Crítico', color: 'var(--error)' };
  }
  if (priority === 'warning') {
    return { label: 'Atención', color: 'var(--warning)' };
  }
  return { label: 'Info', color: 'var(--accent)' };
}

export default function NotificationItem({ notif, onClick }) {
  const priorityInfo = getPriorityBadge(notif.priority);
  const isUnread = !notif.read_at;

  return (
    <div
      onClick={() => onClick(notif)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick(notif);
      }}
      style={{
        ...getPriorityStyle(notif.priority),
        padding: '14px',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        border: '1px solid var(--border-glass)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'var(--bg-glass)',
              color: priorityInfo.color,
              border: `1px solid ${priorityInfo.color}`,
              textTransform: 'uppercase',
            }}
          >
            {priorityInfo.label}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)', textTransform: 'capitalize' }}>
            {notif.category}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {formatRelativeTime(notif.created_at)}
          </span>
          {isUnread && (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent)',
              }}
            />
          )}
        </div>
      </div>

      <h4 style={{ fontSize: '14px', fontWeight: isUnread ? 700 : 500, color: 'var(--text-main)', marginBottom: '4px' }}>
        {notif.title}
      </h4>

      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
        {notif.body}
      </p>
    </div>
  );
}
