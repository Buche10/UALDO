import React from 'react';
import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_AREA_LABELS,
  getStatusStyle,
  formatTimeAgo,
} from './incidentUi';

export default function IncidentCard({ incident, onClick }) {
  if (!incident) return null;

  const typeLabel = INCIDENT_TYPE_LABELS[incident.type] || incident.type;
  const statusLabel = INCIDENT_STATUS_LABELS[incident.status] || incident.status;
  const areaLabel = INCIDENT_AREA_LABELS[incident.area] || incident.area;
  const statusStyle = getStatusStyle(incident.status);
  const timeAgo = formatTimeAgo(incident.occurred_at || incident.created_at);

  const assignedName = incident.assigned_to_user?.name || incident.assigned_to?.name;
  const assignedFirstName = assignedName ? assignedName.trim().split(' ')[0] : 'Sin asignar';

  return (
    <button
      type="button"
      onClick={() => onClick?.(incident)}
      style={{
        width: '100%',
        padding: '12px 14px',
        borderRadius: '10px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--surface-soft)',
              color: 'var(--accent)',
              border: '1px solid var(--border-glass)',
              fontWeight: 600,
            }}
          >
            {typeLabel}
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: statusStyle.bg,
              border: `1px solid ${statusStyle.border}`,
              color: statusStyle.text,
              fontWeight: 600,
            }}
          >
            {statusLabel}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
            {areaLabel}
          </span>
        </div>

        <span style={{ fontSize: '11px', color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
          {timeAgo}
        </span>
      </div>

      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px', lineHeight: '1.3' }}>
        {incident.title}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
        <span>Asignado: {assignedFirstName}</span>
        {incident.evidence?.length > 0 && (
          <span style={{ fontSize: '11px', color: 'var(--accent)' }}>
            {incident.evidence.length} {incident.evidence.length === 1 ? 'foto' : 'fotos'}
          </span>
        )}
      </div>
    </button>
  );
}
