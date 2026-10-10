import React, { useRef, useState } from 'react';
import { ArrowLeft, Ban } from 'lucide-react';
import { useVoidProductionRun } from '../../../hooks/useVoidProductionRun';
import { formatQuantity } from '../../../services/quantityFormat';
import { formatDate, formatKg, formatMoney, formatPct, formatSignedPct, runLocation } from './productionFormat';
import VoidProductionDialog from './VoidProductionDialog';

const card = { padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' };
const metricLabel = { fontSize: '11px', color: 'var(--text-muted)' };
const metricValue = { fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' };

/** "0,05 kg (1,25 %)" o un solo "Sin dato" si el motor no lo calculó. */
function unaccountedText(run) {
  if (run.unaccounted_weight === null || run.unaccounted_weight === undefined) return 'Sin dato';
  return `${formatKg(run.unaccounted_weight)} (${formatPct(run.unaccounted_pct)})`;
}

function Metric({ label, value, tone }) {
  return (
    <div>
      <div style={metricLabel}>{label}</div>
      <div style={{ ...metricValue, color: tone || metricValue.color }}>{value}</div>
    </div>
  );
}

function LineRow({ line, showCost }) {
  return (
    <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '12px' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
          {line.item_name || `Insumo ${line.item_id}`}{line.is_main ? ' (principal)' : ''}
        </div>
        {line.expected_quantity !== null && line.expected_quantity !== undefined && (
          <div style={{ color: 'var(--text-muted)' }}>Esperado: {formatQuantity(line.expected_quantity)} {line.unit}</div>
        )}
        {showCost && line.unit_cost !== undefined && (
          <div style={{ color: 'var(--text-muted)' }}>Costo unitario: {formatMoney(line.unit_cost)}</div>
        )}
      </div>
      <div style={{ fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
        {formatQuantity(line.quantity)} {line.unit}
      </div>
    </div>
  );
}

function CostSummary({ run }) {
  const incomplete = run.cost_status !== 'complete';
  return (
    <div style={card}>
      <Metric label="Costo de las entradas" value={formatMoney(run.input_cost)} />
      {incomplete && (
        <p style={{ fontSize: '11px', color: 'var(--warning)', margin: '6px 0 0 0' }}>
          Costo incompleto: falta el costo de alguna entrada o los subproductos valen toda la pieza. Las porciones no cambiaron su costo.
        </p>
      )}
    </div>
  );
}

/**
 * Detalle de una producción con las cifras del motor (Brief 21p). Los costos
 * solo llegan para el dueño; anular también es solo del dueño.
 */
export default function ProductionRunDetail({ run, isOwner, onBack, onVoided }) {
  const [showVoid, setShowVoid] = useState(false);
  const voidTriggerRef = useRef(null);
  const headingRef = useRef(null);
  const { voiding, error, submitVoid, clearError } = useVoidProductionRun({
    onVoided: (updated) => {
      setShowVoid(false);
      if (onVoided) onVoided(updated);
    },
  });

  const lowYield = run.yield_difference_pct !== null && run.yield_difference_pct !== undefined && Number(run.yield_difference_pct) < 0;
  const inputs = (run.lines || []).filter((line) => line.direction === 'input');
  const outputs = (run.lines || []).filter((line) => line.direction === 'output');
  const showCost = isOwner && run.cost_status !== undefined;
  const voided = run.status === 'voided';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <button type="button" onClick={onBack} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: '4px 0' }}>
        <ArrowLeft size={16} />
        <span>Volver a producciones</span>
      </button>

      <div style={card}>
        <h3 ref={headingRef} tabIndex={-1} style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{run.template_name}</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
          {runLocation(run)}, {formatDate(run.created_at)}. {voided ? 'Anulada' : 'Registrada'}.
        </p>
        {voided && run.void_reason && <p style={{ fontSize: '12px', color: 'var(--warning)', margin: '6px 0 0 0' }}>Motivo de la anulación: {run.void_reason}</p>}
        {run.notes && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>{run.notes}</p>}
      </div>

      <div style={{ ...card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <Metric label="Rendimiento real" value={formatPct(run.real_yield_pct)} />
        <Metric label="Esperado" value={formatPct(run.expected_yield_pct)} />
        <Metric label="Diferencia" value={formatSignedPct(run.yield_difference_pct)} tone={lowYield ? 'var(--warning)' : undefined} />
        <Metric label="Peso sin explicar" value={unaccountedText(run)} />
        <Metric label="Entradas" value={formatKg(run.input_weight)} />
        <Metric label="Porciones" value={formatKg(run.main_output_weight)} />
        <Metric label="Subproductos" value={formatKg(run.byproduct_weight)} />
        <Metric label="Merma que se tira" value={formatKg(run.waste_quantity)} />
      </div>

      {showCost && <CostSummary run={run} />}

      <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '4px 0 0 0', color: 'var(--text-main)' }}>Entradas</h4>
      {inputs.map((line) => <LineRow key={line.id} line={line} showCost={false} />)}
      <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '4px 0 0 0', color: 'var(--text-main)' }}>Salidas</h4>
      {outputs.map((line) => <LineRow key={line.id} line={line} showCost={showCost} />)}

      {isOwner && !voided && (
        <button ref={voidTriggerRef} type="button" onClick={() => { clearError(); setShowVoid(true); }} style={{ padding: '10px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'var(--surface-strong)', color: 'var(--error)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Ban size={14} />
          <span>Anular</span>
        </button>
      )}

      <VoidProductionDialog
        isOpen={showVoid}
        voiding={voiding}
        error={error}
        onClose={() => setShowVoid(false)}
        onConfirm={(reason) => submitVoid(run.id, reason)}
        triggerRef={voidTriggerRef}
        fallbackFocusRef={headingRef}
      />
    </div>
  );
}
