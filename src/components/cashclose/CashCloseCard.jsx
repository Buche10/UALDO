import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { formatUsd } from '../../services/money';
import { DIFFERENCE_CAUSE_LABELS } from '../../services/cashCloseClient';

const getStatusLabel = (item) => {
  if (item.status === 'revision') return 'En revisión';
  if (item.status === 'cerrado') return item.auto_cerrado ? 'Cerrado solo' : 'Cerrado';
  if (item.status === 'borrador') return 'Borrador';
  return item.status || 'Desconocido';
};

const getStatusStyle = (status) => {
  if (status === 'revision') {
    return {
      background: 'var(--warning-soft)',
      color: 'var(--warning)',
      border: '1px solid var(--border-warning)',
    };
  }
  if (status === 'cerrado') {
    return {
      background: 'var(--success-soft)',
      color: 'var(--success)',
      border: '1px solid var(--border-success)',
    };
  }
  return {
    background: 'var(--surface-soft)',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-glass)',
  };
};

export default function CashCloseCard({ cierre, onSelectFecha }) {
  const isReview = cierre.status === 'revision';
  const reasonCount = Array.isArray(cierre.discrepancias) ? cierre.discrepancias.length : 0;
  const declaredBy = typeof cierre.declared_by === 'object' ? cierre.declared_by?.name : cierre.declared_by;
  const causeLabel = DIFFERENCE_CAUSE_LABELS[cierre.difference_cause] || cierre.difference_cause;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectFecha(cierre.fecha)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelectFecha(cierre.fecha);
      }}
      className="glass-card glass-card-interactive"
      style={{
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        border: isReview ? '1px solid var(--border-warning)' : '1px solid var(--border-glass)',
        background: isReview ? 'var(--warning-soft)' : 'var(--bg-card)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '14px' }}>
            <Calendar size={14} color="var(--accent)" />
            <span>{cierre.fecha}</span>
          </div>

          <span
            style={{
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600,
              ...getStatusStyle(cierre.status),
            }}
          >
            {getStatusLabel(cierre)}
          </span>

          {isReview && reasonCount > 0 && (
            <span
              style={{
                padding: '2px 7px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                background: 'var(--warning)',
                color: 'var(--bg-dark)',
              }}
            >
              {reasonCount} {reasonCount === 1 ? 'motivo' : 'motivos'}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <div>
            <span>Ventas: </span>
            <strong style={{ color: 'var(--text-main)' }}>{formatUsd(cierre.ventas_del_dia)}</strong>
          </div>
          <div>
            <span>Dif. efectivo: </span>
            <strong style={{ color: 'var(--text-main)' }}>{formatUsd(cierre.diferencia_efectivo)}</strong>
          </div>
        </div>

        {declaredBy && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Declarado por: </span>
            <strong style={{ color: 'var(--text-main)' }}>{declaredBy}</strong>
          </div>
        )}

        {isReview && cierre.difference_cause && (
          <div style={{ fontSize: '12px', color: 'var(--warning)', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
            <div>
              <span>Causa: </span>
              <strong>{causeLabel}</strong>
            </div>
            {cierre.difference_explanation && (
              <div>
                <span>Explicación: </span>
                <span style={{ color: 'var(--text-main)' }}>{cierre.difference_explanation}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <ChevronRight size={18} color="var(--text-muted)" />
    </div>
  );
}
