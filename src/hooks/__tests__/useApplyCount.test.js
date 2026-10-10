import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useApplyCount } from '../useApplyCount';
import * as inventoryCountsClient from '../../services/inventoryCountsClient';

describe('useApplyCount hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('aborts and sets error if savePendingLines fails, without calling applyCount', async () => {
    const savePendingLines = vi.fn().mockResolvedValue(false);
    const applySpy = vi.spyOn(inventoryCountsClient, 'applyCount');

    const { result } = renderHook(() =>
      useApplyCount({ countId: 5, savePendingLines })
    );

    let res;
    await act(async () => {
      res = await result.current.confirmAndApply();
    });

    expect(res.ok).toBe(false);
    expect(result.current.error).toContain('No se pudo guardar el avance pendiente');
    expect(applySpy).not.toHaveBeenCalled();
  });

  it('verifies call order: saves pending lines before calling applyCount', async () => {
    const callOrder = [];
    const savePendingLines = vi.fn().mockImplementation(async () => {
      callOrder.push('savePendingLines');
      return true;
    });

    vi.spyOn(inventoryCountsClient, 'applyCount').mockImplementation(async () => {
      callOrder.push('applyCount');
      return { ok: true, data: { status: 'applied' } };
    });

    vi.spyOn(inventoryCountsClient, 'getCount').mockImplementation(async () => {
      callOrder.push('getCount');
      return { ok: true, data: { data: { id: 5, status: 'applied' } } };
    });

    const { result } = renderHook(() =>
      useApplyCount({ countId: 5, savePendingLines })
    );

    await act(async () => {
      await result.current.confirmAndApply();
    });

    expect(callOrder).toEqual(['savePendingLines', 'applyCount', 'getCount']);
  });

  it('handles applyCount failure (409 conflict) with custom or fallback message', async () => {
    const savePendingLines = vi.fn().mockResolvedValue(true);
    const applySpy = vi.spyOn(inventoryCountsClient, 'applyCount').mockResolvedValueOnce({
      ok: false,
      status: 409,
      data: { message: 'El conteo ya estaba cerrado o aplicado.' },
    });

    const { result } = renderHook(() =>
      useApplyCount({ countId: 5, savePendingLines })
    );

    let res;
    await act(async () => {
      res = await result.current.confirmAndApply();
    });

    expect(res.ok).toBe(false);
    expect(result.current.error).toBe('El conteo ya estaba cerrado o aplicado.');
    expect(result.current.applying).toBe(false);

    // 409 without message in data
    applySpy.mockResolvedValueOnce({
      ok: false,
      status: 409,
      data: null,
    });
    await act(async () => {
      await result.current.confirmAndApply();
    });
    expect(result.current.error).toBe('El conteo ya estaba cerrado o aplicado.');
  });

  it('handles applyCount failure (422 validation) with message, error or fallback', async () => {
    const savePendingLines = vi.fn().mockResolvedValue(true);
    const applySpy = vi.spyOn(inventoryCountsClient, 'applyCount').mockResolvedValueOnce({
      ok: false,
      status: 422,
      data: { message: 'No hay líneas registradas para aplicar.' },
    });

    const { result } = renderHook(() =>
      useApplyCount({ countId: 5, savePendingLines })
    );

    let res;
    await act(async () => {
      res = await result.current.confirmAndApply();
    });

    expect(res.ok).toBe(false);
    expect(result.current.error).toBe('No hay líneas registradas para aplicar.');

    // 422 with res.error
    applySpy.mockResolvedValueOnce({
      ok: false,
      status: 422,
      error: 'Insumo inválido',
    });
    await act(async () => {
      await result.current.confirmAndApply();
    });
    expect(result.current.error).toBe('Insumo inválido');

    // 422 default fallback
    applySpy.mockResolvedValueOnce({
      ok: false,
      status: 422,
      data: null,
    });
    await act(async () => {
      await result.current.confirmAndApply();
    });
    expect(result.current.error).toBe('No se puede aplicar el conteo. Revisa las líneas o insumos.');
  });

  it('applies count and fetches applied detail diffs on success, falling back to res.data if detail fetch fails', async () => {
    const savePendingLines = vi.fn().mockResolvedValue(true);
    const onAppliedSuccess = vi.fn();

    vi.spyOn(inventoryCountsClient, 'applyCount').mockResolvedValue({
      ok: true,
      data: { data: { id: 5, status: 'applied', fromApply: true } },
    });

    const mockDetail = {
      id: 5,
      location: 'warehouse',
      status: 'applied',
      lines: [
        { item_id: 1, item_name: 'Papas', difference: -2 },
      ],
    };

    const getSpy = vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValueOnce({
      ok: true,
      data: { data: mockDetail },
    });

    const { result } = renderHook(() =>
      useApplyCount({ countId: 5, onAppliedSuccess, savePendingLines })
    );

    let res;
    await act(async () => {
      res = await result.current.confirmAndApply();
    });

    expect(res.ok).toBe(true);
    expect(res.data).toEqual(mockDetail);
    expect(result.current.appliedDetail).toEqual(mockDetail);
    expect(onAppliedSuccess).toHaveBeenCalledWith(mockDetail);

    // Now test fallback to res.data.data when getCount fails
    getSpy.mockResolvedValueOnce({
      ok: false,
      error: 'Fallo temporal al consultar detalle',
    });
    await act(async () => {
      res = await result.current.confirmAndApply();
    });
    expect(res.ok).toBe(true);
    expect(res.data).toEqual({ id: 5, status: 'applied', fromApply: true });
  });

  it('handles generic error when applyCount fails with unexpected status and fallbacks', async () => {
    const applySpy = vi.spyOn(inventoryCountsClient, 'applyCount').mockResolvedValueOnce({
      ok: false,
      status: 500,
      error: 'Error interno del servidor',
    });

    const { result } = renderHook(() =>
      useApplyCount({ countId: 5 })
    );

    let res;
    await act(async () => {
      res = await result.current.confirmAndApply();
    });

    expect(res.ok).toBe(false);
    expect(result.current.error).toBe('Error interno del servidor');

    // Generic error with data.message
    applySpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      data: { message: 'Fallo de base de datos' },
    });
    await act(async () => {
      await result.current.confirmAndApply();
    });
    expect(result.current.error).toBe('Fallo de base de datos');

    // Generic fallback default
    applySpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    await act(async () => {
      await result.current.confirmAndApply();
    });
    expect(result.current.error).toBe('Error al aplicar el conteo.');
  });
});
