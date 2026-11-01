import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import { getLocationLabel, getWithdrawalStatusBadge, getFirstName, getCancelCapability } from './withdrawalHelpers';

export default function WithdrawalCard({
  withdrawal,
  currentUser,
  showAuthor = false,
  onCloseClick,
  onCancelClick,
}) {
  const [expanded, setExpanded] = useState(false);
  const badge = getWithdrawalStatusBadge(withdrawal.status);
  const items = withdrawal.lines || withdrawal.items || [];
  const authorName = getFirstName(withdrawal.user?.name || withdrawal.user_name);
  const capability = getCancelCapability(withdrawal, currentUser);
  const isOpen = withdrawal.status === 'open' || withdrawal.status === 'escalated';

  return (
    <div
      className="glass-card"
      style={{
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        borderRadius: '14px',
        border: '1px solid var(--border-glass)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
              {getLocationLabel(withdrawal.to_location)}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: badge.bg,
                color: badge.color,
                border: `1px solid ${badge.border}`,
              }}
            >
              {badge.text}
            </span>
          </div>
          {showAuthor && (
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              Por {authorName}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '11px',
            gap: '2px',
          }}
        >
          <span>{expanded ? 'Ocultar' : 'Detalles'}</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
          {withdrawal.purpose || 'Sin motivo especificado'}
        </p>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {items.map((it) => `${it.quantity} ${it.unit || ''} ${it.item_name || it.name || 'Insumo'}`).join(', ')}
        </div>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: '4px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-glass)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          {items.map((it, idx) => (
            <div key={it.id || idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{it.item_name || it.name || 'Insumo'}</span>
              <span>
                {it.quantity} {it.unit || ''}
                {it.consumed !== undefined ? ` · Usado: ${it.consumed} · Devuelto: ${it.returned}` : ''}
              </span>
            </div>
          ))}
          {withdrawal.note && (
            <div style={{ fontStyle: 'italic', marginTop: '4px' }}>Nota: {withdrawal.note}</div>
          )}
          {withdrawal.late_reason && (
            <div style={{ fontStyle: 'italic', color: 'var(--warning)' }}>
              Retiro tardío: {withdrawal.late_reason}
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {capability.canCancel && (
            <button
              type="button"
              onClick={() => onCancelClick(withdrawal)}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '9999px',
                fontSize: '12px',
                background: 'var(--surface-soft)',
                color: 'var(--error)',
                border: '1px solid var(--border-glass)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <XCircle size={14} />
              <span>Cancelar</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onCloseClick(withdrawal)}
            style={{
              flex: 2,
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'var(--primary)',
              color: 'var(--text-on-primary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <CheckCircle size={14} />
            <span>Cerrar retiro</span>
          </button>
        </div>
      )}
    </div>
  );
}
