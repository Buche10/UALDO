import React from 'react';
import { Ban, User, Check, X } from 'lucide-react';
import { AREA_LABELS } from '../../services/permissions';

function formatDecidedDate(dateVal) {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    return dateVal.slice(0, 10);
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function OvertimeCard({
  entry,
  canVoid = false,
  canApprove = false,
  onVoidClick,
  onApproveClick,
  onRejectClick,
}) {
  if (!entry) return null;

  const workerName = entry.worker?.name || entry.worker_name || 'Personal';
  const areaLabel = AREA_LABELS[entry.area] || entry.area_label || entry.area;
  const isVoided = Boolean(entry.voided);
  const registeredBy = entry.registered_by?.name;
  const status = entry.status || 'pending';

  const decidedByName = entry.decided_by?.name || (entry.decided_at ? 'Administración' : null);
  const decidedDate = formatDecidedDate(entry.decided_at);
  const showDecided = Boolean(decidedByName && (status === 'approved' || status === 'rejected'));

  const isPending = status === 'pending';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

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
            {isVoided ? (
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
            ) : (
              <>
                {isPending && (
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'var(--warning-soft)',
                      color: 'var(--warning)',
                      border: '1px solid var(--border-warning)',
                      fontWeight: 600,
                    }}
                  >
                    Pendiente
                  </span>
                )}
                {isApproved && (
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'var(--success-soft)',
                      color: 'var(--success)',
                      border: '1px solid var(--border-success)',
                      fontWeight: 600,
                    }}
                  >
                    Aprobada
                  </span>
                )}
                {isRejected && (
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
                    Rechazada
                  </span>
                )}
              </>
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

      {isRejected && entry.decision_note && (
        <div style={{ fontSize: '12px', color: 'var(--error)', background: 'var(--error-soft)', padding: '6px 8px', borderRadius: '4px' }}>
          Motivo de rechazo: {entry.decision_note}
        </div>
      )}

      {showDecided && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Decidió {decidedByName} el {decidedDate}
        </div>
      )}

      {!isVoided && isPending && canApprove && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={() => onApproveClick?.(entry)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: 'none',
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Check size={14} />
            <span>Aprobar</span>
          </button>
          <button
            type="button"
            onClick={() => onRejectClick?.(entry)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid var(--border-glass)',
              background: 'var(--chip-bg)',
              color: 'var(--text-main)',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <X size={14} />
            <span>Rechazar</span>
          </button>
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
