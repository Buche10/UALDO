import React from 'react';
import { Info } from 'lucide-react';
import { DIFFERENCE_CAUSES, DIFFERENCE_CAUSE_LABELS } from '../../../services/cashCloseClient';

export default function DeclarationCauseFields({
  differenceCause,
  differenceExplanation,
  onCauseChange,
  onExplanationChange,
}) {
  const isExplanationRequired =
    differenceCause === 'otro' || differenceCause === 'faltante_sin_explicar';

  return (
    <div
      className="glass-card"
      style={{
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        border: '1px solid var(--border-warning)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--warning)',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        <Info size={14} />
        <span>El cierre quedará en revisión de administración</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="difference_cause" style={{ fontSize: '12px', fontWeight: 600 }}>
          Causa de la diferencia
        </label>
        <select
          id="difference_cause"
          value={differenceCause}
          onChange={(e) => onCauseChange(e.target.value)}
          style={{
            padding: '8px 10px',
            borderRadius: '8px',
            border: '1px solid var(--border-glass)',
            background: 'var(--bg-input, var(--chip-bg))',
            color: 'var(--text-main)',
            fontSize: '13px',
          }}
        >
          <option value="">Selecciona una causa...</option>
          {DIFFERENCE_CAUSES.map((c) => (
            <option key={c} value={c}>
              {DIFFERENCE_CAUSE_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="difference_explanation" style={{ fontSize: '12px', fontWeight: 600 }}>
          Explicación {isExplanationRequired ? '(obligatoria)' : '(opcional)'}
        </label>
        <textarea
          id="difference_explanation"
          rows={2}
          maxLength={500}
          value={differenceExplanation}
          placeholder="Detalla lo sucedido para administración..."
          onChange={(e) => onExplanationChange(e.target.value)}
          style={{
            padding: '8px 10px',
            borderRadius: '8px',
            border: '1px solid var(--border-glass)',
            background: 'var(--bg-input, var(--chip-bg))',
            color: 'var(--text-main)',
            fontSize: '13px',
            resize: 'vertical',
          }}
        />
      </div>
    </div>
  );
}
