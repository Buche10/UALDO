import React from 'react';
import { Play, ArrowRight } from 'lucide-react';
import { formatUsd } from '../../../services/money';

function getStatusBadge(status, differencesCount, unexplainedCount) {
  switch (status) {
    case 'draft':
      return { text: 'Contando', bg: 'var(--primary-soft)', border: 'var(--border-glow)', color: 'var(--accent)' };
    case 'submitted': {
      const text = differencesCount > 0
        ? `Enviado: ${unexplainedCount} ${unexplainedCount === 1 ? 'diferencia por explicar' : 'diferencias por explicar'}`
        : 'Enviado';
      return { text, bg: 'var(--warning-soft)', border: 'var(--border-warning)', color: 'var(--warning)' };
    }
    case 'validated':
      return { text: 'Validado', bg: 'var(--success-soft)', border: 'var(--border-success)', color: 'var(--success)' };
    case 'escalated':
      return { text: 'Escalado', bg: 'var(--warning-soft)', border: 'var(--border-warning)', color: 'var(--warning)' };
    case 'pending':
    default:
      return { text: 'Sin empezar', bg: 'var(--surface-soft)', border: 'var(--border-glass)', color: 'var(--text-muted)' };
  }
}

export default function DailyCloseCard({
  item,
  canCount = false,
  canValidate = false,
  canSeeCosts = false,
  onStartCount,
  onOpenCount,
  onOpenDifferences,
}) {
  const { location, location_label, count_id, status = 'pending', counted_by, validated_by, self_validated, differences_count = 0, unexplained_count = 0, difference_value_cents } = item;
  const badge = getStatusBadge(status, differences_count, unexplained_count);

  const countedFirstName = counted_by ? counted_by.split(' ')[0] : null;
  const validatedFirstName = validated_by ? validated_by.split(' ')[0] : null;

  return (
    <div
      className="glass-card"
      style={{
        padding: '18px',
        borderRadius: '16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
          {location_label || location}
        </h3>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 600,
            background: badge.bg,
            border: `1px solid ${badge.border}`,
            color: badge.color,
          }}
        >
          {badge.text}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
        {countedFirstName && (
          <div>
            <span>Contó: </span>
            <strong style={{ color: 'var(--text-main)', fontWeight: 500 }}>{countedFirstName}</strong>
          </div>
        )}
        {validatedFirstName && (
          <div>
            <span>Validó: </span>
            <strong style={{ color: 'var(--text-main)', fontWeight: 500 }}>{validatedFirstName}</strong>
          </div>
        )}
        {self_validated && (
          <div style={{ marginTop: '2px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'var(--surface-soft)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-subtle)',
                fontSize: '11px',
              }}
            >
              Validado por quien contó
            </span>
          </div>
        )}
        {canSeeCosts && difference_value_cents !== undefined && (
          <div style={{ marginTop: '4px', fontSize: '12px' }}>
            <span>Valor diferencias: </span>
            <strong style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              {formatUsd(difference_value_cents / 100)}
            </strong>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
        {status === 'pending' && canCount && (
          <button
            type="button"
            onClick={() => onStartCount(location)}
            className="btn-primary"
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Play size={14} />
            <span>Empezar conteo</span>
          </button>
        )}

        {status === 'draft' && canCount && (
          <button
            type="button"
            onClick={() => onOpenCount(count_id)}
            className="btn-primary"
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Continuar conteo</span>
            <ArrowRight size={14} />
          </button>
        )}

        {(status === 'submitted' || status === 'escalated') && (
          <button
            type="button"
            onClick={() => onOpenDifferences(count_id)}
            className="btn-primary"
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{canValidate ? 'Revisar diferencias' : 'Ver diferencias'}</span>
            <ArrowRight size={14} />
          </button>
        )}

        {status === 'validated' && (
          <button
            type="button"
            onClick={() => onOpenDifferences(count_id)}
            className="glass-card-interactive"
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid var(--border-glass)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Ver detalle
          </button>
        )}
      </div>
    </div>
  );
}
