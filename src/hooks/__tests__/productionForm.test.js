import { describe, it, expect } from 'vitest';
import {
  basisInput,
  buildPayload,
  emptyValues,
  expectedFromPlan,
  FORMAT_ERROR,
  mapServerErrors,
  validateForm,
} from '../productionForm';
import { burgerTemplate, lomoTemplate } from './productionFixtures';

const formWith = (values, extra = {}) => ({
  location: 'kitchen',
  values: { ...emptyValues(lomoTemplate), ...values },
  mainOutputWeight: '2.8',
  wasteQuantity: '0.25',
  notes: '',
  ...extra,
});

describe('productionForm', () => {
  it('finds the basis input only when the template has a primary one', () => {
    expect(basisInput(lomoTemplate).item_id).toBe(1);
    expect(basisInput(burgerTemplate)).toBeNull();
  });

  it('maps the engine plan to field keys without computing anything', () => {
    const expected = expectedFromPlan({
      inputs: [{ item_id: 1, expected_quantity: 4.5 }],
      outputs: [{ item_id: 2, expected_quantity: 9 }],
    });
    expect(expected).toEqual({ 'input:1': 4.5, 'output:2': 9 });
    expect(expectedFromPlan(null)).toEqual({});
  });

  it('validates format, positive inputs and at least one input', () => {
    expect(validateForm(lomoTemplate, formWith({ 'input:1': '4', 'output:2': '8' }))).toEqual({});

    const errors = validateForm(lomoTemplate, formWith({ 'input:1': '0', 'output:2': '1.2345' }));
    expect(errors['input:1']).toBe('La entrada debe ser mayor que 0.');
    expect(errors['output:2']).toBe(FORMAT_ERROR);

    expect(validateForm(lomoTemplate, formWith({ 'output:2': '8' })).inputs).toBe('Registra al menos una entrada.');
  });

  it('requires weight and waste only when the template does', () => {
    const missing = formWith({ 'input:1': '4' }, { mainOutputWeight: '', wasteQuantity: ' ' });
    const errors = validateForm(lomoTemplate, missing);
    expect(errors.main_output_weight).toBe('Registra el peso de las porciones principales.');
    expect(errors.waste_quantity).toBe('Registra la merma que se tira (0 si no hubo).');

    const optional = { ...lomoTemplate, requires_weight_control: false, requires_waste_record: false };
    expect(validateForm(optional, missing)).toEqual({});
    expect(validateForm(optional, { ...missing, mainOutputWeight: 'abc' }).main_output_weight).toBe(FORMAT_ERROR);
  });

  it('sends only written lines in template order, including 0', () => {
    const payload = buildPayload(lomoTemplate, formWith({ 'input:1': ' 4,5 ', 'output:4': '0', 'output:2': '9' }));
    expect(payload.templateId).toBe(3);
    expect(payload.inputs).toEqual([{ item_id: 1, quantity: '4,5' }]);
    expect(payload.outputs).toEqual([{ item_id: 2, quantity: '9' }, { item_id: 4, quantity: '0' }]);
  });

  it('translates engine errors by the position of the line that was sent', () => {
    const payload = { inputs: [{ item_id: 1 }], outputs: [{ item_id: 2 }, { item_id: 4 }] };
    const mapped = mapServerErrors({
      'outputs.1.quantity': ['Esta ficha no permite ajustar la salida.'],
      'inputs.0.item_id': 'No es una entrada de la ficha.',
      outputs: ['Registra al menos una salida principal mayor que 0.'],
      'outputs.9.item_id': ['Sin línea'],
    }, payload);

    expect(mapped['output:4']).toBe('Esta ficha no permite ajustar la salida.');
    expect(mapped['input:1']).toBe('No es una entrada de la ficha.');
    // El error general del motor no se pisa con el de una línea que no existe.
    expect(mapped.outputs).toBe('Registra al menos una salida principal mayor que 0.');
  });

  it('maps keys without sub-field and positions shifted by a blank earlier line', () => {
    const template = { ...lomoTemplate, inputs: [{ item_id: 9, unit: 'kg' }, ...lomoTemplate.inputs] };
    const payload = buildPayload(template, formWith({ 'input:1': '4', 'output:2': '8' }));
    expect(payload.inputs).toEqual([{ item_id: 1, quantity: '4' }]);

    const mapped = mapServerErrors({ 'inputs.0': ['Falta'], 'outputs.0.quantity': ['Se esperaban 8.'], 'outputs.5': ['Sin línea'] }, payload);
    expect(mapped['input:1']).toBe('Falta');
    expect(mapped['input:9']).toBeUndefined();
    expect(mapped['output:2']).toBe('Se esperaban 8.');
    expect(mapped.outputs).toBe('Sin línea');
  });
});
