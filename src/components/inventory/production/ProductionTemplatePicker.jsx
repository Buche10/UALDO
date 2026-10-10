import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useProductionTemplates } from '../../../hooks/useProductionRuns';
import { formatPct } from './productionFormat';

/**
 * Elegir la ficha del porcionado entre las fichas activas (Brief 21p).
 */
export default function ProductionTemplatePicker({ onPick, onBack }) {
  const { templates, loading, error, reload } = useProductionTemplates();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <button type="button" onClick={onBack} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: '4px 0' }}>
        <ArrowLeft size={16} />
        <span>Volver a producciones</span>
      </button>

      <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Elige la ficha</h3>

      <div aria-live="polite">
        {error && (
          <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <span>{error}</span>
          <button type="button" onClick={reload} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '9999px' }}>Reintentar</button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>Cargando fichas...</div>
      ) : templates.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>No hay fichas activas. Se importan desde DobleFilo.</div>
      ) : (
        templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onPick(template)}
            className="glass-card-interactive"
            style={{ textAlign: 'left', padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', cursor: 'pointer', color: 'var(--text-main)' }}
          >
            <span style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>{template.name}</span>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
              Rendimiento esperado {formatPct(template.expected_yield_pct)}
            </span>
          </button>
        ))
      )}
    </div>
  );
}
