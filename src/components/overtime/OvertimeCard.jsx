import React from 'react';
import { Ban, User } from 'lucide-react';
import { AREA_LABELS } from '../../services/permissions';

export default function OvertimeCard({ entry, canVoid = false, onVoidClick }) {
  if (!entry) return null;

  const workerName = entry.worker?.name || entry.worker_name || 'Personal';
  const areaLabel = AREA_LABELS[entry.area] || entry.area_label || entry.area;
  const isVoided = Boolean(entry.voided);
  const registeredBy = entry.registered_by?.name;

  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: '10px',
        background: isVoided ? 'var(--card-subtle-bg)' : 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        opacity: isVoided ? 0.7 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
              {workerName}
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'var(--surface-soft)',
                color: 'var(--accent)',
                border: '1px solid var(--border-glass)',
              }}
            >
              {areaLabel}
            </span>
            {isVoided && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'var(--error-soft)',
                  color: 'var(--error)',
                  border: '1px solid var(--border-error)',
                  fontWeight: 600,
                }}
              >
                Anulado
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {entry.work_date}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: isVoided ? 'var(--text-subtle)' : 'var(--accent)',
            }}
          >
            {entry.hours} h
          </span>
        </div>
      </div>

      {entry.note && (
        <div style={{ fontSize: '12px', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
          &ldquo;{entry.note}&rdquo;
        </div>
      )}

      {isVoided && entry.void_reason && (
        <div style={{ fontSize: '12px', color: 'var(--error)', background: 'var(--error-soft)', padding: '6px 8px', borderRadius: '4px' }}>
          Motivo de anulación: {entry.void_reason}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid var(--border-glass)', fontSize: '11px', color: 'var(--text-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <User size={12} />
          <span>{registeredBy ? `Registrado por ${registeredBy}` : 'Registrado'}</span>
        </div>

        {!isVoided && canVoid && (
          <button
            type="button"
            onClick={() => onVoidClick?.(entry)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              background: 'transparent',
              border: '1px solid var(--border-error)',
              color: 'var(--error)',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            <Ban size={12} />
            Anular
          </button>
        )}
      </div>
    </div>
  );
}
