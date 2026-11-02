import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_CAUSE_LABELS,
  COMPLAINT_KIND_LABELS,
  INCIDENT_AREA_LABELS,
} from '../../services/incidentsClient';

export function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  if (diffMs < 0) return 'recién';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'hace un momento';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHours < 24) return `hace ${diffHours} h`;
  if (diffDays === 1) return 'hace 1 día';
  if (diffDays < 30) return `hace ${diffDays} días`;
  return date.toLocaleDateString();
}

export function getStatusStyle(status) {
  switch (status) {
    case 'abierta':
      return { bg: 'var(--warning-soft)', border: 'var(--border-warning)', text: 'var(--warning)' };
    case 'en_atencion':
      return { bg: 'var(--accent-soft)', border: 'var(--border-glass)', text: 'var(--accent)' };
    case 'resuelta':
      return { bg: 'var(--success-soft)', border: 'var(--border-success)', text: 'var(--success)' };
    case 'validada':
      return { bg: 'var(--surface-soft)', border: 'var(--border-glass)', text: 'var(--text-main)' };
    case 'descartada':
      return { bg: 'var(--error-soft)', border: 'var(--border-error)', text: 'var(--error)' };
    default:
      return { bg: 'var(--chip-bg)', border: 'var(--border-glass)', text: 'var(--text-muted)' };
  }
}

export {
  INCIDENT_TYPE_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_CAUSE_LABELS,
  COMPLAINT_KIND_LABELS,
  INCIDENT_AREA_LABELS,
};
