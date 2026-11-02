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

describe('useProductionRunForm con lote (Brief 40p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(productionClient, 'getPlan').mockResolvedValue({ ok: true, data: { data: { inputs: [], outputs: [] } } });
  });

  it('envía input_lot_id y justification del lote elegido', async () => {
    const spy = vi.spyOn(productionClient, 'recordRun').mockResolvedValue({ ok: true, status: 201, data: { data: recordedRun } });
    const { result } = renderHook(() => useProductionRunForm({ template: lomoTemplate, onRecorded: vi.fn() }));
    fill(result);
    act(() => {
      result.current.setLotSelection({
        lotId: 13,
        justification: 'Reservado para el evento',
        needsJustification: true,
        recommendedCode: 'L0001',
      });
    });

    await act(async () => { await result.current.submit(); });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchObject({
      inputLotId: 13,
      justification: 'Reservado para el evento',
    });
  });

  it('no registra si se salta el FIFO sin motivo', async () => {
    const spy = vi.spyOn(productionClient, 'recordRun');
    const { result } = renderHook(() => useProductionRunForm({ template: lomoTemplate, onRecorded: vi.fn() }));
    fill(result);
    act(() => {
      result.current.setLotSelection({ lotId: 13, justification: '', needsJustification: true });
    });

    await act(async () => { await result.current.submit(); });

    expect(spy).not.toHaveBeenCalled();
    expect(result.current.fieldErrors.lot).toContain('Indica el motivo');
  });

  it('muestra tal cual el 422 "Porciona un lote a la vez"', async () => {
    vi.spyOn(productionClient, 'recordRun').mockResolvedValue({
      ok: false,
      status: 422,
      data: { message: 'Porciona un lote a la vez', errors: { inputs: ['Porciona un lote a la vez'] } },
    });
    const { result } = renderHook(() => useProductionRunForm({ template: lomoTemplate, onRecorded: vi.fn() }));
    fill(result);

    await act(async () => { await result.current.submit(); });

    expect(result.current.error).toBe('Porciona un lote a la vez');
  });
});
