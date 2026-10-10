import React from 'react';
import { ArrowLeft, Scissors } from 'lucide-react';
import { useProductionRunForm } from '../../../hooks/useProductionRunForm';
import { inputKey, outputKey } from '../../../hooks/productionForm';
import { INVENTORY_LOCATIONS } from '../../../services/inventoryLocations';
import ProductionLineField from './ProductionLineField';

const sectionTitle = { fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 0 0' };
const fieldLabel = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' };
const textInput = { width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)', fontSize: '13px' };
const fieldError = { fontSize: '11px', color: 'var(--error)', marginTop: '4px', display: 'block' };

/** Errores del motor sin campo propio en pantalla: van en el aviso general. */
const GENERAL_ERROR_KEYS = ['inputs', 'outputs', 'template_id', 'location', 'notes'];

function WeightField({ id, label, required, value, error, onChange }) {
  return (
    <div>
      <label htmlFor={id} style={fieldLabel}>
        {label}{required ? ' (obligatorio)' : ''}
      </label>
      <input id={id} type="text" inputMode="decimal" placeholder="0" value={value} onChange={(e) => onChange(e.target.value)} className="glass-input" style={textInput} />
      <span aria-live="polite" style={fieldError}>{error || null}</span>
    </div>
  );
}

/**
 * Registrar un porcionado desde una ficha (Brief 21p).
 */
export default function ProductionRunForm({ template, onBack, onRecorded }) {
  const { form, setValue, setField, submit, submitting, error, fieldErrors, expected, scalesBySum, planLoading, planFailed } = useProductionRunForm({ template, onRecorded });
  const generalErrors = GENERAL_ERROR_KEYS.map((key) => fieldErrors[key]).filter(Boolean);

  let planText = 'Escribe la entrada principal para ver lo esperado.';
  if (scalesBySum) planText = 'Las cantidades esperadas se calculan al registrar.';
  else if (planLoading) planText = 'Calculando lo esperado...';
  else if (planFailed) planText = 'No se pudo calcular lo esperado; puedes registrar igual.';

  const renderLine = (line, keyOf, isOutput) => {
    const key = keyOf(line.item_id);
    return (
      <ProductionLineField
        key={key}
        fieldKey={key}
        label={line.item_name || `Insumo ${line.item_id}`}
        unit={line.unit}
        value={form.values[key] ?? ''}
        expected={expected[key]}
        isMain={isOutput && line.is_main}
        error={fieldErrors[key]}
        onChange={setValue}
        disabled={submitting}
      />
    );
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      <button type="button" onClick={onBack} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: '4px 0' }}>
        <ArrowLeft size={16} />
        <span>Elegir otra ficha</span>
      </button>

      <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scissors size={16} color="var(--accent)" />
          <span>{template.name}</span>
        </h3>
        <p aria-live="polite" style={{ fontSize: '12px', color: planFailed ? 'var(--warning)' : 'var(--text-muted)', margin: '4px 0 0 0' }}>
          {planText}
        </p>
      </div>

      <div aria-live="polite">
        {error && (
          <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px', border: '1px solid var(--border-error)' }}>
            {error}
            {generalErrors.map((message) => <div key={message}>{message}</div>)}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="production-location" style={fieldLabel}>Ubicación</label>
        <select id="production-location" value={form.location} onChange={(e) => setField('location', e.target.value)} style={textInput}>
          {INVENTORY_LOCATIONS.map((loc) => (
            <option key={loc.value} value={loc.value}>{loc.label}</option>
          ))}
        </select>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
          Las entradas salen y las salidas entran en esta ubicación.
        </span>
      </div>

      <h4 style={sectionTitle}>Entradas</h4>
      {(template.inputs || []).map((line) => renderLine(line, inputKey, false))}

      <h4 style={sectionTitle}>Salidas</h4>
      {(template.outputs || []).map((line) => renderLine(line, outputKey, true))}

      <WeightField id="production-main-weight" label="Peso de las porciones (kg)" required={template.requires_weight_control} value={form.mainOutputWeight} error={fieldErrors.main_output_weight} onChange={(v) => setField('mainOutputWeight', v)} />
      <WeightField id="production-waste" label="Merma que se tira (kg)" required={template.requires_waste_record} value={form.wasteQuantity} error={fieldErrors.waste_quantity} onChange={(v) => setField('wasteQuantity', v)} />

      <div>
        <label htmlFor="production-notes" style={fieldLabel}>Notas (opcional)</label>
        <textarea id="production-notes" rows={2} maxLength={500} value={form.notes} onChange={(e) => setField('notes', e.target.value)} style={{ ...textInput, resize: 'vertical' }} />
      </div>

      <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '12px', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer' }}>
        {submitting ? 'Registrando...' : 'Registrar porcionado'}
      </button>
    </form>
  );
}
