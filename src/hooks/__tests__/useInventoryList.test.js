import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInventoryList } from '../useInventoryList';
import * as inventoryClient from '../../services/inventoryClient';

describe('useInventoryList hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces search by 300 ms and triggers a single request on fast typing', async () => {
    const listSpy = vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: {
        items: [{ id: 1, name: 'Pollo' }],
        totals: { count: 1, low_stock_count: 0 },
        meta: { current_page: 1, last_page: 1 },
      },
    });

    const { result } = renderHook(() => useInventoryList());

    // Initial load
    await act(async () => {
      await Promise.resolve();
    });
    expect(listSpy).toHaveBeenCalledTimes(1);

    // Fast typing simulation
    act(() => {
      result.current.setSearch('P');
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      result.current.setSearch('Po');
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      result.current.setSearch('Pollo');
    });

    // Advance 250 ms -> still not 300 ms after last keystroke
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(listSpy).toHaveBeenCalledTimes(1);

    // Advance remaining 50 ms -> 300 ms reached
    await act(async () => {
      vi.advanceTimersByTime(50);
      await Promise.resolve();
    });

    expect(listSpy).toHaveBeenCalledTimes(2);
    expect(listSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'Pollo', page: 1 })
    );
  });

  it('resets page and loads alerts when switching tabs to alerts', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: {
        items: [{ id: 1, name: 'Queso' }],
        totals: { count: 1, low_stock_count: 0 },
        meta: { current_page: 1, last_page: 2 },
      },
    });

    const alertsSpy = vi.spyOn(inventoryClient, 'fetchAlerts').mockResolvedValue({
      ok: true,
      data: {
        alerts: [{ id: 10, name: 'Leche' }],
      },
    });

    const { result } = renderHook(() => useInventoryList());

    await act(async () => {
      await Promise.resolve();
    });

    // Switch to alerts tab
    await act(async () => {
      result.current.setActiveTab('alerts');
      await Promise.resolve();
    });

    expect(alertsSpy).toHaveBeenCalledTimes(1);
    expect(result.current.alerts).toHaveLength(1);
    expect(result.current.alerts[0].name).toBe('Leche');
  });

  it('keeps previous items and sets error when network request fails', async () => {
    vi.spyOn(inventoryClient, 'listInventory')
      .mockResolvedValueOnce({
        ok: true,
        data: {
          items: [{ id: 1, name: 'Sal' }],
          totals: { count: 1, low_stock_count: 0 },
          meta: { current_page: 1, last_page: 1 },
        },
      })
      .mockResolvedValueOnce({
        ok: false,
        error: 'Error al conectar con la base de datos',
      });

    const { result } = renderHook(() => useInventoryList());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.items).toHaveLength(1);

    // Reload fails
    await act(async () => {
      result.current.reload();
      await Promise.resolve();
    });

    expect(result.current.error).toBe('Error al conectar con la base de datos');
    // Previous list is NOT erased
    expect(result.current.items).toHaveLength(1);
  });

  it('updates stock locally using updateItemStock and loads next page', async () => {
    vi.spyOn(inventoryClient, 'listInventory')
      .mockResolvedValueOnce({
        ok: true,
        data: {
          items: [{ id: 1, name: 'Carne', stock: '10.000' }],
          totals: { count: 2, low_stock_count: 0 },
          meta: { current_page: 1, last_page: 2 },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          items: [{ id: 2, name: 'Pollo', stock: '5.000' }],
          totals: { count: 2, low_stock_count: 0 },
          meta: { current_page: 2, last_page: 2 },
        },
      });

    const { result } = renderHook(() => useInventoryList());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.hasMore).toBe(true);

    // Load next page
    await act(async () => {
      result.current.loadNextPage();
      await Promise.resolve();
    });

    expect(result.current.items).toHaveLength(2);

    // Update item 1 stock locally
    act(() => {
      result.current.updateItemStock(1, '8.000');
    });

    expect(result.current.items.find(i => i.id === 1).stock).toBe('8.000');
  });

  it('reloads list with includeInactive=true when toggled, and defaults to false', async () => {
    const listSpy = vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: {
        items: [{ id: 1, name: 'Pollo' }],
        totals: { count: 1, low_stock_count: 0 },
        meta: { current_page: 1, last_page: 1 },
      },
    });

    const { result } = renderHook(() => useInventoryList());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.includeInactive).toBe(false);
    expect(listSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ includeInactive: false })
    );

    // Toggle includeInactive to true
    await act(async () => {
      result.current.setIncludeInactive(true);
      await Promise.resolve();
    });

    expect(result.current.includeInactive).toBe(true);
    expect(listSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ includeInactive: true })
    );
  });

  it('handles alerts fetch error, catalog exception, and data.data fallback', async () => {
    // 1. Alerts error branch
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValueOnce({
      ok: true,
      data: { items: [] },
    });
    vi.spyOn(inventoryClient, 'fetchAlerts').mockResolvedValueOnce({
      ok: false,
      error: 'Fallo al cargar alertas',
    });

    const { result } = renderHook(() => useInventoryList());
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      result.current.setActiveTab('alerts');
      await Promise.resolve();
    });

    expect(result.current.error).toBe('Fallo al cargar alertas');

    // 2. Exception in listInventory
    vi.spyOn(inventoryClient, 'listInventory').mockRejectedValueOnce(new Error('Network down'));
    await act(async () => {
      result.current.setActiveTab('all');
      await Promise.resolve();
    });
    expect(result.current.error).toBe('Error de conexión al cargar datos.');

    // 3. Fallback to res.data.data when items is undefined
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValueOnce({
      ok: true,
      data: {
        data: [{ id: 50, name: 'Arroz' }],
      },
    });
    await act(async () => {
      result.current.reload();
      await Promise.resolve();
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Arroz');
  });
});
