import React from 'react';
import { Scissors } from 'lucide-react';
import { formatQuantity } from '../../services/quantityFormat';
import { formatMoneyCents } from './lotFormat';

function yieldText(value) {
  if (value === null || value === undefined) return 'Rendimiento sin dato';
  return `Rendimiento ${new Intl.NumberFormat('es-EC', { maximumFractionDigits: 1 }).format(Number(value))} %`;
}

/** Porcionados vinculados al lote, con rendimiento y merma. */
export default function LotProductions({ productions = [], canSeeCosts }) {
  if (productions.length === 0) {
    return <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Todavía no hay porcionados de este lote.</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      {productions.map((run) => (
        <div key={run.id} style={{ padding: '9px 10px', borderRadius: '9px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
            <Scissors size={13} color="var(--accent)" />
            <span>{run.template_name || 'Porcionado'}</span>
            {run.status === 'voided' && <span style={{ fontSize: '10px', color: 'var(--error)' }}>Anulado</span>}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {yieldText(run.real_yield_pct)} · Merma {formatQuantity(run.waste_quantity)} kg · Entrada {formatQuantity(run.input_weight)} kg
          </div>
          {canSeeCosts && run.input_cost_cents !== undefined && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Costo de entrada {formatMoneyCents(run.input_cost_cents)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
