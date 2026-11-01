import React from 'react';
import { formatQuantity } from '../../../services/quantityFormat';
import { DAILY_CLOSE_CAUSES } from './dailyCloseCauses';

export default function DifferenceRow({
  line,
  cause = '',
  explanation = '',
  onChange,
  disabled = false,
}) {
  const diffVal = Number(line.difference ?? 0);
  const diffSign = diffVal > 0 ? '+' : '';
  const unit = line.unit ? ` ${line.unit}` : '';
  const formattedDiff = `${diffSign}${formatQuantity(diffVal)}${unit}`;
  const requiresExplanation = cause === 'otro' && !explanation.trim();

  const handleCauseChange = (e) => {
    onChange(line.item_id, { cause: e.target.value, explanation });
  };

  const handleExplanationChange = (e) => {
    onChange(line.item_id, { cause, explanation: e.target.value });
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '14px',
        borderRadius: '12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
            {line.item_name || `Insumo #${line.item_id}`}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Contado: {formatQuantity(line.counted_quantity)}{unit} | Sistema: {formatQuantity(line.system_quantity)}{unit}
          </div>
        </div>

        <div
          style={{
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            background: 'var(--warning-soft)',
            border: '1px solid var(--border-warning)',
            color: 'var(--warning)',
          }}
        >
          {formattedDiff}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor={`cause-select-${line.item_id}`} style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Causa de la diferencia
          </label>
          <select
            id={`cause-select-${line.item_id}`}
            value={cause}
            onChange={handleCauseChange}
            disabled={disabled}
            className="form-input"
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              background: 'var(--bg-dark)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-glass)',
            }}
          >
            <option value="">Selecciona una causa...</option>
            {DAILY_CLOSE_CAUSES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor={`explanation-input-${line.item_id}`} style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Explicación {cause === 'otro' ? '(obligatoria)' : '(opcional)'}
          </label>
          <input
            id={`explanation-input-${line.item_id}`}
            type="text"
            value={explanation}
            onChange={handleExplanationChange}
            disabled={disabled}
            placeholder={cause === 'otro' ? 'Detalla qué ocurrió (requerido)...' : 'Detalle adicional (opcional)...'}
            maxLength={500}
            className="glass-input"
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              background: 'var(--bg-dark)',
              color: 'var(--text-main)',
              border: requiresExplanation ? '1px solid var(--border-warning)' : '1px solid var(--border-glass)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
