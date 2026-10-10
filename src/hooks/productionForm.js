import { normalizeProductionQuantity } from '../services/productionClient';

/**
 * Reglas puras del formulario de porcionado (Brief 21p). Las claves de campo
 * son `input:<item_id>` y `output:<item_id>`; las cantidades esperadas vienen
 * siempre del plan del motor.
 */

export const inputKey = (itemId) => `input:${itemId}`;
export const outputKey = (itemId) => `output:${itemId}`;

export const FORMAT_ERROR = 'Usa solo números, con 3 decimales como máximo.';

/** Entrada que define el plan, o null si la ficha escala por la suma de entradas. */
export function basisInput(template) {
  return (template?.inputs || []).find((line) => line.is_primary) || null;
}

/** Valores iniciales: todos los campos vacíos. */
export function emptyValues(template) {
  const values = {};
  (template?.inputs || []).forEach((line) => { values[inputKey(line.item_id)] = ''; });
  (template?.outputs || []).forEach((line) => { values[outputKey(line.item_id)] = ''; });
  return values;
}

/** Cantidades esperadas por campo, tomadas del plan del motor. */
export function expectedFromPlan(plan) {
  const expected = {};
  (plan?.inputs || []).forEach((line) => { expected[inputKey(line.item_id)] = line.expected_quantity; });
  (plan?.outputs || []).forEach((line) => { expected[outputKey(line.item_id)] = line.expected_quantity; });
  return expected;
}

function lineErrors(lines, values, keyOf, { positive }) {
  const errors = {};
  lines.forEach((line) => {
    const raw = values[keyOf(line.item_id)];
    if (raw === undefined || String(raw).trim() === '') return;
    const value = normalizeProductionQuantity(raw);
    if (value === null) errors[keyOf(line.item_id)] = FORMAT_ERROR;
    else if (positive && Number(value) <= 0) errors[keyOf(line.item_id)] = 'La entrada debe ser mayor que 0.';
  });
  return errors;
}

function weightError(raw, required, missingMessage) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return required ? missingMessage : null;
  return normalizeProductionQuantity(raw) === null ? FORMAT_ERROR : null;
}

/**
 * Errores del formulario antes de enviar, por campo. Vacío si se puede enviar.
 */
export function validateForm(template, form) {
  const errors = {
    ...lineErrors(template.inputs || [], form.values, inputKey, { positive: true }),
    ...lineErrors(template.outputs || [], form.values, outputKey, { positive: false }),
  };
  const hasInput = (template.inputs || []).some((line) => String(form.values[inputKey(line.item_id)] || '').trim() !== '');
  if (!hasInput) errors.inputs = 'Registra al menos una entrada.';

  const mainWeight = weightError(form.mainOutputWeight, template.requires_weight_control, 'Registra el peso de las porciones principales.');
  if (mainWeight) errors.main_output_weight = mainWeight;
  const waste = weightError(form.wasteQuantity, template.requires_waste_record, 'Registra la merma que se tira (0 si no hubo).');
  if (waste) errors.waste_quantity = waste;
  return errors;
}

/** Líneas escritas, en el orden de la ficha. */
function filledLines(lines, values, keyOf) {
  return lines
    .filter((line) => String(values[keyOf(line.item_id)] || '').trim() !== '')
    .map((line) => ({ item_id: line.item_id, quantity: String(values[keyOf(line.item_id)]).trim() }));
}

/** Datos para recordRun: solo las entradas y salidas escritas (0 incluido). */
export function buildPayload(template, form) {
  return {
    templateId: template.id,
    location: form.location,
    inputs: filledLines(template.inputs || [], form.values, inputKey),
    outputs: filledLines(template.outputs || [], form.values, outputKey),
    mainOutputWeight: form.mainOutputWeight,
    wasteQuantity: form.wasteQuantity,
    notes: form.notes,
  };
}

/**
 * Traduce los errores 422 del motor a claves de campo: `inputs.N.*` y
 * `outputs.N.*` señalan la línea N enviada, no la de la ficha. Un error
 * general del motor (`inputs`, `outputs`) nunca se pisa.
 */
export function mapServerErrors(errors, payload) {
  const mapped = {};
  Object.keys(errors || {}).forEach((key) => {
    const message = Array.isArray(errors[key]) ? errors[key].join(' ') : String(errors[key]);
    const match = key.match(/^(inputs|outputs)\.(\d+)(?:\.|$)/);
    if (!match) {
      mapped[key] = message;
      return;
    }
    const line = payload[match[1]]?.[Number(match[2])];
    if (line) {
      mapped[match[1] === 'inputs' ? inputKey(line.item_id) : outputKey(line.item_id)] = message;
    } else if (!mapped[match[1]]) {
      // Sin línea que corresponda: va al error general sin pisar el del motor.
      mapped[match[1]] = message;
    }
  });
  return mapped;
}
