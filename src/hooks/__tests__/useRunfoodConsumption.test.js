import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRunfoodConsumption, shiftIsoDate } from '../useRunfoodConsumption';
import * as client from '../../services/runfoodConsumptionClient';

describe('useRunfoodConsumption hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('shiftIsoDate helper', () => {
    it('desplaza dias correctamente adelante y atras', () => {
      expect(shiftIsoDate('2026-10-15', 1)).toBe('2026-10-16');
      expect(shiftIsoDate('2026-10-15', -1)).toBe('2026-10-14');
      expect(shiftIsoDate('2026-10-01', -1)).toBe('2026-09-30');
      expect(shiftIsoDate('invalid', 1)).toBe('invalid');
    });
  });

  it('inicializa y carga ajustes y consumo del dia', async () => {
    const mockSettings = { enabled: true, start_date: '2026-10-01', location: 'kitchen' };
    const mockConsumption = {
      fecha: '2026-10-15',
      estado: 'aplicado',
      lineas: [{ inventory_item_id: 1, nombre: 'Carne', cantidad: '5.000', delta: '5.000', origenes: [] }]
    };

    vi.spyOn(client, 'getConsumptionSettings').mockResolvedValueOnce({ ok: true, data: mockSettings });
    vi.spyOn(client, 'getConsumption').mockResolvedValueOnce({ ok: true, data: mockConsumption });

    const { result } = renderHook(() => useRunfoodConsumption({ initialDate: '2026-10-15' }));

    await waitFor(() => {
      expect(result.current.settingsLoading).toBe(false);
      expect(result.current.consumptionLoading).toBe(false);
    });

    expect(result.current.settings).toEqual(mockSettings);
    expect(result.current.consumption).toEqual(mockConsumption);
    expect(result.current.date).toBe('2026-10-15');
  });

  it('permite navegar entre dias anterior y posterior', async () => {
    vi.spyOn(client, 'getConsumptionSettings').mockResolvedValue({
      ok: true,
      data: { enabled: true, start_date: '2026-10-01', location: 'kitchen' }
    });
    const consumptionSpy = vi.spyOn(client, 'getConsumption').mockResolvedValue({
      ok: true,
      data: { fecha: '2026-10-15', estado: 'aplicado', lineas: [] }
    });

    const { result } = renderHook(() => useRunfoodConsumption({ initialDate: '2026-10-15' }));

    await waitFor(() => {
      expect(result.current.consumptionLoading).toBe(false);
    });

    await act(async () => {
      result.current.goToPreviousDay();
    });

    expect(result.current.date).toBe('2026-10-14');

    await act(async () => {
      result.current.goToNextDay();
    });

    expect(result.current.date).toBe('2026-10-15');
  });

  it('guarda ajustes y actualiza el estado', async () => {
    vi.spyOn(client, 'getConsumptionSettings').mockResolvedValue({
      ok: true,
      data: { enabled: false, start_date: null, location: 'kitchen' }
    });
    vi.spyOn(client, 'getConsumption').mockResolvedValue({
      ok: true,
      data: { fecha: '2026-10-15', estado: 'apagado', lineas: [] }
    });
    const updateSpy = vi.spyOn(client, 'updateConsumptionSettings').mockResolvedValue({
      ok: true,
      data: { enabled: true, start_date: '2026-10-10', location: 'warehouse' }
    });

    const { result } = renderHook(() => useRunfoodConsumption({ initialDate: '2026-10-15' }));

    await waitFor(() => {
      expect(result.current.settingsLoading).toBe(false);
    });

    let res;
    await act(async () => {
      res = await result.current.saveSettings({
        enabled: true,
        start_date: '2026-10-10',
        location: 'warehouse'
      });
    });

    expect(res.ok).toBe(true);
    expect(updateSpy).toHaveBeenCalledWith({
      enabled: true,
      start_date: '2026-10-10',
      location: 'warehouse'
    });
    expect(result.current.settings.enabled).toBe(true);
  });

  it('maneja errores al guardar ajustes', async () => {
    vi.spyOn(client, 'getConsumptionSettings').mockResolvedValue({
      ok: true,
      data: { enabled: false, start_date: null, location: 'kitchen' }
    });
    vi.spyOn(client, 'getConsumption').mockResolvedValue({
      ok: true,
      data: { fecha: '2026-10-15', estado: 'apagado', lineas: [] }
    });
    vi.spyOn(client, 'updateConsumptionSettings').mockResolvedValue({
      ok: false,
      error: 'Error de validacion'
    });

    const { result } = renderHook(() => useRunfoodConsumption({ initialDate: '2026-10-15' }));

    await waitFor(() => {
      expect(result.current.settingsLoading).toBe(false);
    });

    let res;
    await act(async () => {
      res = await result.current.saveSettings({
        enabled: true,
        start_date: '2026-10-10',
        location: 'kitchen'
      });
    });

    expect(res.ok).toBe(false);
    expect(result.current.settingsError).toBe('Error de validacion');
  });

  it('ejecuta el recalculo y limpia el resultado', async () => {
    vi.spyOn(client, 'getConsumptionSettings').mockResolvedValue({
      ok: true,
      data: { enabled: true, start_date: '2026-10-01', location: 'kitchen' }
    });
    vi.spyOn(client, 'getConsumption').mockResolvedValue({
      ok: true,
      data: { fecha: '2026-10-15', estado: 'aplicado', lineas: [] }
    });
    vi.spyOn(client, 'recalculateConsumption').mockResolvedValue({
      ok: true,
      data: { status: 'queued', dias_encolados: 7 }
    });

    const { result } = renderHook(() => useRunfoodConsumption({ initialDate: '2026-10-15' }));

    await waitFor(() => {
      expect(result.current.consumptionLoading).toBe(false);
    });

    await act(async () => {
      await result.current.recalculate({ desde: '2026-10-01', hasta: '2026-10-07' });
    });

    expect(result.current.recalculateResult).toEqual({ status: 'queued', dias_encolados: 7 });

    act(() => {
      result.current.clearRecalculate();
    });

    expect(result.current.recalculateResult).toBeNull();
  });

  it('un cambio de fecha con error no muestra datos del día anterior y queda en null', async () => {
    vi.spyOn(client, 'getConsumptionSettings').mockResolvedValue({
      ok: true,
      data: { enabled: true, start_date: '2026-10-01', location: 'kitchen' }
    });
    vi.spyOn(client, 'getConsumption')
      .mockResolvedValueOnce({
        ok: true,
        data: { fecha: '2026-10-15', estado: 'aplicado', lineas: [{ id: 1 }] }
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        error: 'Error del servidor'
      });

    const { result } = renderHook(() => useRunfoodConsumption({ initialDate: '2026-10-15' }));

    await waitFor(() => {
      expect(result.current.consumption?.fecha).toBe('2026-10-15');
    });

    await act(async () => {
      result.current.setDate('2026-10-16');
    });

    await waitFor(() => {
      expect(result.current.consumptionError).toBe('Error del servidor');
    });

    // consumption debe quedar en null y no mostrar los datos del 2026-10-15
    expect(result.current.consumption).toBeNull();
  });

  it('descarta respuestas fuera de orden al cambiar de fecha', async () => {
    vi.spyOn(client, 'getConsumptionSettings').mockResolvedValue({
      ok: true,
      data: { enabled: true, start_date: '2026-10-01', location: 'kitchen' }
    });

    let resolveFirst;
    const slowPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    vi.spyOn(client, 'getConsumption').mockImplementation((targetDate) => {
      if (targetDate === '2026-10-10') return slowPromise;
      if (targetDate === '2026-10-20') {
        return Promise.resolve({
          ok: true,
          data: { fecha: '2026-10-20', estado: 'aplicado', lineas: [{ id: 20 }] }
        });
      }
      return Promise.resolve({
        ok: true,
        data: { fecha: targetDate, estado: 'aplicado', lineas: [] }
      });
    });

    const { result } = renderHook(() => useRunfoodConsumption({ initialDate: '2026-10-01' }));
    await waitFor(() => expect(result.current.consumptionLoading).toBe(false));

    // Lanzar fecha 1 (lenta)
    act(() => {
      result.current.setDate('2026-10-10');
    });

    // Lanzar fecha 2 (rápida)
    act(() => {
      result.current.setDate('2026-10-20');
    });

    await waitFor(() => {
      expect(result.current.consumption?.fecha).toBe('2026-10-20');
    });

    // Se resuelve la primera fecha después
    await act(async () => {
      resolveFirst({
        ok: true,
        data: { fecha: '2026-10-10', estado: 'aplicado', lineas: [{ id: 10 }] }
      });
    });

    // Debe conservar los datos de la fecha 2 (2026-10-20), descartando la respuesta tardía
    expect(result.current.consumption?.fecha).toBe('2026-10-20');
  });
});
