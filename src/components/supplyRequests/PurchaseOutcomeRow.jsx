import React from 'react';
import { styles } from '../common/uiStyles';
import { quantityWithUnit } from './requestUi';

export default function PurchaseOutcomeRow({
  item,
  current = {},
  onSetOutcome,
  onFieldChange,
}) {
  const outcome = current.outcome;

  return (
    <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
            {item.name || item.free_text_name}
          </span>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Pedido #{item.requestId} por {item.requesterName}
          </div>
        </div>
        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
          {quantityWithUnit(item.quantity, item.unit)}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          type="button"
          onClick={() => onSetOutcome(item.id, 'purchased')}
          className="btn-pill"
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: '9999px',
            border: '1px solid var(--border-glass)',
            background: outcome === 'purchased' ? 'var(--primary)' : 'var(--surface-soft)',
            color: outcome === 'purchased' ? 'var(--on-primary)' : 'var(--text-main)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Comprado
        </button>
        <button
          type="button"
          onClick={() => onSetOutcome(item.id, 'partial')}
          className="btn-pill"
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: '9999px',
            border: '1px solid var(--border-glass)',
            background: outcome === 'partial' ? 'var(--warning-soft)' : 'var(--surface-soft)',
            color: outcome === 'partial' ? 'var(--warning)' : 'var(--text-main)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Parcial
        </button>
        <button
          type="button"
          onClick={() => onSetOutcome(item.id, 'not_purchased')}
          className="btn-pill"
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: '9999px',
            border: '1px solid var(--border-glass)',
            background: outcome === 'not_purchased' ? 'var(--error-soft)' : 'var(--surface-soft)',
            color: outcome === 'not_purchased' ? 'var(--error)' : 'var(--text-main)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          No comprado
        </button>
      </div>

      {outcome === 'partial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          <input
            type="text"
            inputMode="decimal"
            placeholder={`Cantidad comprada (${item.unit || 'unidad'})`}
            value={current.purchased_quantity || ''}
            onChange={(e) => onFieldChange(item.id, 'purchased_quantity', e.target.value)}
            className="form-input"
            style={{ ...styles.input, flex: 1, fontSize: '12px' }}
          />
          <input
            type="text"
            placeholder="Motivo de compra parcial (obligatorio)"
            value={current.reason || ''}
            onChange={(e) => onFieldChange(item.id, 'reason', e.target.value)}
            className="form-input"
            style={{ ...styles.input, fontSize: '12px' }}
          />
        </div>
      )}

      {outcome === 'not_purchased' && (
        <div style={{ marginTop: '4px' }}>
          <input
            type="text"
            placeholder="Motivo por el que no se compró (obligatorio)"
            value={current.reason || ''}
            onChange={(e) => onFieldChange(item.id, 'reason', e.target.value)}
            className="form-input"
            style={{ ...styles.input, fontSize: '12px' }}
          />
        </div>
      )}
    </div>
  );
}
