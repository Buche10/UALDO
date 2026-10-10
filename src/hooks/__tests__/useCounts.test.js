import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounts } from '../useCounts';
import * as inventoryCountsClient from '../../services/inventoryCountsClient';

describe('useCounts hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not load counts if user is not owner and calling reload/loadMore does nothing (killing mutation)', async () => {
    const spy = vi.spyOn(inventoryCountsClient, 'listCounts');
    const { result } = renderHook(() => useCounts({ isOwner: false }));

    expect(result.current.counts).toEqual([]);
    expect(spy).not.toHaveBeenCalled();

    // Calling reload or loadMore must be guarded by if (!isOwner) return;
    await act(async () => {
      await result.current.reload();
      await result.current.loadMore();
      await Promise.resolve();
    });

    expect(spy).not.toHaveBeenCalled();
  });

  it('loads counts on mount for owner and sorts drafts first', async () => {
    const mockData = {
      data: [
        { id: 1, location: 'kitchen', status: 'applied' },
        { id: 2, location: 'warehouse', status: 'draft' },
        { id: 3, location: 'lounge', status: 'cancelled' },
      ],
      meta: { current_page: 1, last_page: 2 },
    };

    const spy = vi.spyOn(inventoryCountsClient, 'listCounts').mockResolvedValue({
      ok: true,
      data: mockData,
    });

    const { result } = renderHook(() => useCounts({ isOwner: true }));

    // Wait for the async load
    await act(async () => {
      await Promise.resolve();
    });

    expect(spy).toHaveBeenCalledWith({ location: '', status: '', page: 1 });
    expect(result.current.counts.length).toBe(3);
    // draft (id: 2) must be first
    expect(result.current.counts[0].id).toBe(2);
    expect(result.current.hasMore).toBe(true);
  });

  it('handles error when loading counts fails', async () => {
    vi.spyOn(inventoryCountsClient, 'listCounts').mockResolvedValue({
      ok: false,
      error: 'Error al conectar',
    });

    const { result } = renderHook(() => useCounts({ isOwner: true }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe('Error al conectar');
    expect(result.current.counts).toEqual([]);
  });

  it('creates count and adds it to the start of the list', async () => {
    vi.spyOn(inventoryCountsClient, 'listCounts').mockResolvedValue({
      ok: true,
      data: { data: [], meta: { current_page: 1, last_page: 1 } },
    });

    const newCount = { id: 10, location: 'kitchen', status: 'draft' };
    vi.spyOn(inventoryCountsClient, 'createCount').mockResolvedValue({
      ok: true,
      data: { data: newCount },
    });

    const { result } = renderHook(() => useCounts({ isOwner: true }));

    await act(async () => {
      await Promise.resolve();
    });

    let res;
    await act(async () => {
      res = await result.current.createCount('kitchen', 'Reapertura');
    });

    expect(res.ok).toBe(true);
    expect(result.current.counts).toContainEqual(newCount);
  });

  it('cancels count and updates its status to cancelled', async () => {
    const existing = [
      { id: 5, location: 'kitchen', status: 'draft' },
      { id: 6, location: 'warehouse', status: 'draft' },
    ];
    vi.spyOn(inventoryCountsClient, 'listCounts').mockResolvedValue({
      ok: true,
      data: { data: existing, meta: { current_page: 1, last_page: 1 } },
    });
    vi.spyOn(inventoryCountsClient, 'cancelCount').mockResolvedValue({
      ok: true,
    });

    const { result } = renderHook(() => useCounts({ isOwner: true }));

    await act(async () => {
      await Promise.resolve();
    });

    let res;
    await act(async () => {
      res = await result.current.cancelCount(5);
    });

    expect(res.ok).toBe(true);
    const count5 = result.current.counts.find(c => c.id === 5);
    expect(count5.status).toBe('cancelled');
  });

  it('supports pagination via loadMore', async () => {
    const page1Data = {
      data: [{ id: 1, status: 'draft' }],
      meta: { current_page: 1, last_page: 2 },
    };
    const page2Data = {
      data: [{ id: 2, status: 'applied' }],
      meta: { current_page: 2, last_page: 2 },
    };

    const spy = vi.spyOn(inventoryCountsClient, 'listCounts')
      .mockResolvedValueOnce({ ok: true, data: page1Data })
      .mockResolvedValueOnce({ ok: true, data: page2Data });

    const { result } = renderHook(() => useCounts({ isOwner: true }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.counts.length).toBe(1);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(spy).toHaveBeenCalledWith({ location: '', status: '', page: 2 });
    expect(result.current.counts.length).toBe(2);
    expect(result.current.hasMore).toBe(false);

    // Test reload
    await act(async () => {
      await result.current.reload();
    });
    expect(spy).toHaveBeenCalledWith({ location: '', status: '', page: 1 });
  });

  it('handles error responses in createCount and cancelCount', async () => {
    vi.spyOn(inventoryCountsClient, 'listCounts').mockResolvedValue({
      ok: true,
      data: { data: [], meta: { current_page: 1, last_page: 1 } },
    });
    vi.spyOn(inventoryCountsClient, 'createCount').mockResolvedValue({
      ok: false,
      error: 'Ubicación con conteo en curso',
    });
    vi.spyOn(inventoryCountsClient, 'cancelCount').mockResolvedValue({
      ok: false,
      error: 'No se puede cancelar',
    });

    const { result } = renderHook(() => useCounts({ isOwner: true }));

    await act(async () => {
      await Promise.resolve();
    });

    let createRes;
    await act(async () => {
      createRes = await result.current.createCount('kitchen', '');
    });
    expect(createRes.ok).toBe(false);
    expect(createRes.error).toBe('Ubicación con conteo en curso');

    let cancelRes;
    await act(async () => {
      cancelRes = await result.current.cancelCount(99);
    });
    expect(cancelRes.ok).toBe(false);
    expect(cancelRes.error).toBe('No se puede cancelar');
  });
});
