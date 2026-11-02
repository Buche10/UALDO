import React from 'react';
import { formatTimeAgo } from './incidentUi';

const EVENT_LABELS = {
  created: 'Incidencia reportada',
  status_changed: 'Estado actualizado',
  assigned: 'Responsable asignado',
  comment: 'Comentario agregado',
  evidence_added: 'Evidencia fotográfica añadida',
  kitchen_confirmed: 'Confirmación de cocina registrada',
  waste_registered: 'Merma registrada',
};

export default function IncidentTimeline({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div style={{ fontSize: '12px', color: 'var(--text-subtle)', fontStyle: 'italic', padding: '8px 0' }}>
        Sin eventos registrados todavía.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {events.map((evt, idx) => {
        const label = EVENT_LABELS[evt.kind] || evt.kind;
        const timeAgo = formatTimeAgo(evt.created_at);
        const comment = evt.payload?.comment || evt.comment;
        const resolution = evt.payload?.resolution;
        const reason = evt.payload?.reason;
        const author = evt.user?.name || evt.author?.name;

        return (
          <div
            key={evt.id || idx}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'var(--card-subtle-bg)',
              border: '1px solid var(--border-glass)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{label}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{timeAgo}</span>
            </div>

            {author && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Por {author}
              </span>
            )}

            {comment && (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                &ldquo;{comment}&rdquo;
              </div>
            )}

            {resolution && (
              <div style={{ color: 'var(--success)', marginTop: '2px' }}>
                Resolución: {resolution}
              </div>
            )}

            {reason && (
              <div style={{ color: 'var(--error)', marginTop: '2px' }}>
                Motivo: {reason}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
