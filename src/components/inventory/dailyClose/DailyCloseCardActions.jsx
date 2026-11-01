import React from 'react';
import { Play, ArrowRight } from 'lucide-react';

export default function DailyCloseCardActions({
  status,
  isSubmitted,
  canCount,
  canValidate,
  canAdjust,
  location,
  countId,
  onStartCount,
  onOpenCount,
  onOpenDifferences,
}) {
  const btnPill = {
    padding: '8px 16px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  if (status === 'pending' && canCount) {
    return (
      <button
        type="button"
        onClick={() => onStartCount(location)}
        className="btn-primary"
        style={btnPill}
      >
        <Play size={14} />
        <span>Empezar conteo</span>
      </button>
    );
  }

  if (status === 'draft' && canCount) {
    return (
      <button
        type="button"
        onClick={() => onOpenCount(countId)}
        className="btn-primary"
        style={btnPill}
      >
        <span>Continuar conteo</span>
        <ArrowRight size={14} />
      </button>
    );
  }

  if (status === 'escalated') {
    if (!isSubmitted) {
      if (canAdjust) {
        return (
          <button
            type="button"
            onClick={() => onOpenCount(countId)}
            className="btn-primary"
            style={btnPill}
          >
            <span>Completar conteo</span>
            <ArrowRight size={14} />
          </button>
        );
      }
      return (
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '9999px',
            background: 'var(--surface-soft)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-subtle)',
            fontSize: '11px',
            fontWeight: 500,
          }}
        >
          Escalado a administración
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onOpenDifferences(countId)}
        className="btn-primary"
        style={btnPill}
      >
        <span>{canValidate ? 'Revisar diferencias' : 'Ver diferencias'}</span>
        <ArrowRight size={14} />
      </button>
    );
  }

  if (status === 'submitted') {
    return (
      <button
        type="button"
        onClick={() => onOpenDifferences(countId)}
        className="btn-primary"
        style={btnPill}
      >
        <span>{canValidate ? 'Revisar diferencias' : 'Ver diferencias'}</span>
        <ArrowRight size={14} />
      </button>
    );
  }

  if (status === 'validated') {
    return (
      <button
        type="button"
        onClick={() => onOpenDifferences(countId)}
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
    );
  }

  return null;
}
