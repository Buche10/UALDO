import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductionRunForm } from '../useProductionRunForm';
import * as productionClient from '../../services/productionClient';
import { lomoTemplate, recordedRun } from './productionFixtures';

function fill(result) {
  act(() => {
    result.current.setValue('input:1', '4');
    result.current.setValue('output:2', '8');
    result.current.setField('mainOutputWeight', '2,8');
    result.current.setField('wasteQuantity', '0.25');
  });
}

describe('useProductionRunForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(productionClient, 'getPlan').mockResolvedValue({ ok: true, data: { data: { inputs: [], outputs: [] } } });
  });

  it('starts at the template location and does not send when the form is invalid', async () => {
    const spy = vi.spyOn(productionClient, 'recordRun');
    const { result } = renderHook(() => useProductionRunForm({ template: lomoTemplate, onRecorded: vi.fn() }));
    expect(result.current.form.location).toBe('kitchen');
    expect(result.current.scalesBySum).toBe(false);

    await act(async () => { await result.current.submit(); });
    expect(spy).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Revisa los datos marcados.');
    expect(result.current.fieldErrors.inputs).toBeDefined();
    expect(result.current.fieldErrors.main_output_weight).toBeDefined();
  });

  it('reuses the client_uuid after a network error and renews it after a 201', async () => {
    const onRecorded = vi.fn();
    const spy = vi.spyOn(productionClient, 'recordRun')
      .mockResolvedValueOnce({ ok: false, status: 0, isNetworkError: true, error: 'offline' })
      .mockResolvedValueOnce({ ok: true, status: 201, data: { status: 'created', data: recordedRun } })
      .mockResolvedValueOnce({ ok: true, status: 201, data: { status: 'created', data: recordedRun } });
    const { result } = renderHook(() => useProductionRunForm({ template: lomoTemplate, onRecorded }));
    fill(result);

    await act(async () => { await result.current.submit(); });
    expect(result.current.error).toContain('Sin conexión');
    await act(async () => { await result.current.submit(); });
    await act(async () => { await result.current.submit(); });

    const [first, second, third] = spy.mock.calls.map((call) => call[1]);
    expect(second).toBe(first);
    expect(third).not.toBe(first);
    expect(onRecorded).toHaveBeenCalledWith(recordedRun, false);
    expect(spy.mock.calls[0][0].inputs).toEqual([{ item_id: 1, quantity: '4' }]);
  });

  it('reports an idempotent 200 to the caller', async () => {
    const onRecorded = vi.fn();
    vi.spyOn(productionClient, 'recordRun').mockResolvedValue({ ok: true, status: 200, data: { status: 'idempotent', data: recordedRun } });
    const { result } = renderHook(() => useProductionRunForm({ template: lomoTemplate, onRecorded }));
    fill(result);
    await act(async () => { await result.current.submit(); });
    expect(onRecorded).toHaveBeenCalledWith(recordedRun, true);
  });

  it('shows the engine message on a 409 and field errors on a 422', async () => {
    const spy = vi.spyOn(productionClient, 'recordRun')
      .mockResolvedValueOnce({ ok: false, status: 409, data: { message: "Stock insuficiente para 'Lomo Fino Kg' en Cocina." } })
      .mockResolvedValueOnce({ ok: false, status: 422, data: { message: 'Datos inválidos.', errors: { 'outputs.0.quantity': ['Se esperaban 8.000.'], main_output_weight: ['No puede pesar más que las entradas (4.000 kg).'] } } });
    const { result } = renderHook(() => useProductionRunForm({ template: lomoTemplate, onRecorded: vi.fn() }));
    fill(result);

    await act(async () => { await result.current.submit(); });
    expect(result.current.error).toBe("Stock insuficiente para 'Lomo Fino Kg' en Cocina.");

    await act(async () => { await result.current.submit(); });
    expect(result.current.error).toBe('Datos inválidos.');
    expect(result.current.fieldErrors['output:2']).toBe('Se esperaban 8.000.');
    expect(result.current.fieldErrors.main_output_weight).toContain('No puede pesar');
    expect(spy).toHaveBeenCalledTimes(2);

    // Corregir el campo borra su error.
    act(() => { result.current.setValue('output:2', '7'); });
    expect(result.current.fieldErrors['output:2']).toBeUndefined();
  });

  it('keeps the client_uuid after 409, 422 and 500, and renews it after an idempotent 200', async () => {
    const spy = vi.spyOn(productionClient, 'recordRun')
      .mockResolvedValueOnce({ ok: false, status: 409, data: { message: 'Stock insuficiente.' } })
      .mockResolvedValueOnce({ ok: false, status: 422, data: { errors: { location: ['Ubicación inválida.'] } } })
      .mockResolvedValueOnce({ ok: false, status: 500, error: 'Error 500' })
      .mockResolvedValueOnce({ ok: true, status: 200, data: { status: 'idempotent', data: recordedRun } })
      .mockResolvedValueOnce({ ok: true, status: 201, data: { status: 'created', data: recordedRun } });
    const { result } = renderHook(() => useProductionRunForm({ template: lomoTemplate, onRecorded: vi.fn() }));
    fill(result);

    for (let i = 0; i < 5; i++) {
      await act(async () => { await result.current.submit(); });
    }
    const uuids = spy.mock.calls.map((call) => call[1]);
    expect(new Set(uuids.slice(0, 4)).size).toBe(1);
    expect(uuids[4]).not.toBe(uuids[0]);
  });

  it('clears the error of a weight when it is edited', async () => {
    vi.spyOn(productionClient, 'recordRun').mockResolvedValue({ ok: false, status: 422, data: { errors: { main_output_weight: ['No puede pesar más que las entradas.'] } } });
    const { result } = renderHook(() => useProductionRunForm({ template: lomoTemplate, onRecorded: vi.fn() }));
    fill(result);
    await act(async () => { await result.current.submit(); });
    expect(result.current.fieldErrors.main_output_weight).toBeDefined();
    act(() => { result.current.setField('mainOutputWeight', '2'); });
    expect(result.current.fieldErrors.main_output_weight).toBeUndefined();
    act(() => { result.current.setField('notes', 'x'); });
  });

  it('shows a generic error for other failures', async () => {
    vi.spyOn(productionClient, 'recordRun').mockResolvedValue({ ok: false, status: 500, error: 'Error 500' });
    const { result } = renderHook(() => useProductionRunForm({ template: lomoTemplate, onRecorded: vi.fn() }));
    fill(result);
    await act(async () => { await result.current.submit(); });
    expect(result.current.error).toBe('Error 500');
  });
});
