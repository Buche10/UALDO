import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProductionRuns, useProductionTemplates } from '../useProductionRuns';
import { useVoidProductionRun } from '../useVoidProductionRun';
import * as productionClient from '../../services/productionClient';
import { lomoTemplate, recordedRun } from './productionFixtures';

describe('useProductionRuns', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the first page and appends the next one', async () => {
    const spy = vi.spyOn(productionClient, 'listRuns')
      .mockResolvedValueOnce({ ok: true, data: { data: [recordedRun], meta: { current_page: 1, last_page: 2 } } })
      .mockResolvedValueOnce({ ok: true, data: { data: [{ ...recordedRun, id: 40 }], meta: { current_page: 2, last_page: 2 } } });
    const { result } = renderHook(() => useProductionRuns());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.runs).toHaveLength(1);
    expect(result.current.hasMore).toBe(true);

    await act(async () => { await result.current.loadMore(); });
    expect(spy).toHaveBeenLastCalledWith({ page: 2 });
    expect(result.current.runs.map((r) => r.id)).toEqual([41, 40]);
    expect(result.current.hasMore).toBe(false);
  });

  it('does not duplicate a run registered here when loading the next page', async () => {
    vi.spyOn(productionClient, 'listRuns')
      .mockResolvedValueOnce({ ok: true, data: { data: [recordedRun], meta: { current_page: 1, last_page: 2 } } })
      .mockResolvedValueOnce({ ok: true, data: { data: [{ ...recordedRun, id: 99 }, recordedRun], meta: { current_page: 2, last_page: 2 } } });
    const { result } = renderHook(() => useProductionRuns());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.upsertRun({ ...recordedRun, id: 99 }); });
    await act(async () => { await result.current.loadMore(); });
    expect(result.current.runs.map((r) => r.id)).toEqual([99, 41]);
  });

  it('shows an error and upserts a known run', async () => {
    vi.spyOn(productionClient, 'listRuns').mockResolvedValue({ ok: false, status: 500, error: 'Error 500' });
    const { result } = renderHook(() => useProductionRuns());
    await waitFor(() => expect(result.current.error).toBe('Error 500'));

    act(() => { result.current.upsertRun(recordedRun); });
    act(() => { result.current.upsertRun({ ...recordedRun, status: 'voided' }); });
    expect(result.current.runs).toHaveLength(1);
    expect(result.current.runs[0].status).toBe('voided');
  });

  it('ignores a second load while one is running and runs without id', async () => {
    let resolveFirst;
    const spy = vi.spyOn(productionClient, 'listRuns')
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValue({ ok: true, data: { data: null } });
    const { result } = renderHook(() => useProductionRuns());

    act(() => { result.current.reload(); });
    expect(spy).toHaveBeenCalledTimes(1);
    await act(async () => { resolveFirst({ ok: true, data: {} }); });
    expect(result.current.runs).toEqual([]);
    expect(result.current.hasMore).toBe(false);

    act(() => { result.current.upsertRun({ status: 'completed' }); });
    expect(result.current.runs).toEqual([]);
    await act(async () => { await result.current.reload(); });
    expect(result.current.runs).toEqual([]);
  });

  it('uses a default message when the engine sends none', async () => {
    vi.spyOn(productionClient, 'listRuns').mockResolvedValue({ ok: false, status: 500 });
    vi.spyOn(productionClient, 'listTemplates').mockResolvedValue({ ok: false, status: 500 });
    const runs = renderHook(() => useProductionRuns());
    const templates = renderHook(() => useProductionTemplates());
    await waitFor(() => expect(runs.result.current.error).toBe('No se pudieron cargar las producciones.'));
    await waitFor(() => expect(templates.result.current.error).toBe('No se pudieron cargar las fichas.'));
  });

  it('loads the templates and reports errors', async () => {
    vi.spyOn(productionClient, 'listTemplates')
      .mockResolvedValueOnce({ ok: false, status: 500, error: 'Sin conexión' })
      .mockResolvedValueOnce({ ok: true, data: { data: [lomoTemplate] } });
    const { result } = renderHook(() => useProductionTemplates());
    await waitFor(() => expect(result.current.error).toBe('Sin conexión'));
    await act(async () => { await result.current.reload(); });
    expect(result.current.templates).toEqual([lomoTemplate]);
  });
});

describe('useVoidProductionRun', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls onVoided on success', async () => {
    const onVoided = vi.fn();
    vi.spyOn(productionClient, 'voidRun').mockResolvedValue({ ok: true, data: { data: { ...recordedRun, status: 'voided' } } });
    const { result } = renderHook(() => useVoidProductionRun({ onVoided }));
    let ok;
    await act(async () => { ok = await result.current.submitVoid(41, 'Error'); });
    expect(ok).toBe(true);
    expect(onVoided).toHaveBeenCalledWith(expect.objectContaining({ status: 'voided' }));
  });

  it('does not send twice and uses default messages', async () => {
    let resolveFirst;
    const spy = vi.spyOn(productionClient, 'voidRun')
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce({ ok: false, status: 409, data: {} })
      .mockResolvedValueOnce({ ok: false, status: 500 });
    const { result } = renderHook(() => useVoidProductionRun({}));

    let first;
    act(() => { first = result.current.submitVoid(41, 'Error'); });
    let second;
    await act(async () => { second = await result.current.submitVoid(41, 'Error'); });
    expect(second).toBe(false);
    expect(spy).toHaveBeenCalledTimes(1);
    await act(async () => { resolveFirst({ ok: true, data: {} }); await first; });

    await act(async () => { await result.current.submitVoid(41, 'Error'); });
    expect(result.current.error).toContain('una porción ya se usó');
    await act(async () => { await result.current.submitVoid(41, 'Error'); });
    expect(result.current.error).toBe('No se pudo anular la producción.');
    act(() => { result.current.clearError(); });
    expect(result.current.error).toBeNull();
  });

  it('explains 409 and 403', async () => {
    vi.spyOn(productionClient, 'voidRun')
      .mockResolvedValueOnce({ ok: false, status: 409, data: { message: "Stock insuficiente para 'Lomo Fino Unidad' en Cocina." } })
      .mockResolvedValueOnce({ ok: false, status: 403 })
      .mockResolvedValueOnce({ ok: false, status: 500, error: 'Error 500' });
    const { result } = renderHook(() => useVoidProductionRun({ onVoided: vi.fn() }));

    await act(async () => { await result.current.submitVoid(41, 'Error'); });
    expect(result.current.error).toContain('Stock insuficiente');
    await act(async () => { await result.current.submitVoid(41, 'Error'); });
    expect(result.current.error).toBe('Solo el dueño puede anular una producción.');
    await act(async () => { await result.current.submitVoid(41, 'Error'); });
    expect(result.current.error).toBe('Error 500');
  });
});
