import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../useNotifications';
import * as notificationsClient from '../../services/notificationsClient';

describe('useNotifications hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('resets page to 1 when category filter changes', async () => {
    const listSpy = vi.spyOn(notificationsClient, 'listNotifications')
      .mockResolvedValueOnce({
        ok: true,
        data: {
          data: [{ id: '123e4567-e89b-12d3-a456-426614174001', title: 'Aviso 1', category: 'pedidos' }],
          meta: { current_page: 1, last_page: 3 },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          data: [{ id: '123e4567-e89b-12d3-a456-426614174002', title: 'Aviso 2', category: 'pedidos' }],
          meta: { current_page: 2, last_page: 3 },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          data: [{ id: '123e4567-e89b-12d3-a456-426614174003', title: 'Aviso Inventario 1', category: 'inventario' }],
          meta: { current_page: 1, last_page: 1 },
        },
      });

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await Promise.resolve();
    });

    expect(listSpy).toHaveBeenCalledWith({
      unread: null,
      category: '',
      page: 1,
    });

    // Advance to page 2
    await act(async () => {
      result.current.loadNextPage();
      await Promise.resolve();
    });
    expect(listSpy).toHaveBeenCalledWith({
      unread: null,
      category: '',
      page: 2,
    });
    expect(result.current.meta.current_page).toBe(2);

    // Change category filter -> MUST reset to page 1
    await act(async () => {
      result.current.setCategoryFilter('inventario');
      await Promise.resolve();
    });

    expect(listSpy).toHaveBeenLastCalledWith({
      unread: null,
      category: 'inventario',
      page: 1,
    });
    expect(result.current.meta.current_page).toBe(1);
    expect(result.current.notifications).toEqual([
      { id: '123e4567-e89b-12d3-a456-426614174003', title: 'Aviso Inventario 1', category: 'inventario' },
    ]);
  });

  it('sends unread=1 when unreadOnly filter is toggled', async () => {
    const listSpy = vi.spyOn(notificationsClient, 'listNotifications').mockResolvedValue({
      ok: true,
      data: {
        data: [],
        meta: { current_page: 1, last_page: 1 },
      },
    });

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      result.current.setUnreadOnly(true);
      await Promise.resolve();
    });

    expect(listSpy).toHaveBeenLastCalledWith({
      unread: 1,
      category: '',
      page: 1,
    });
  });

  it('does NOT change notifications read status when handleMarkAllRead fails', async () => {
    vi.spyOn(notificationsClient, 'listNotifications').mockResolvedValue({
      ok: true,
      data: {
        data: [
          { id: '123e4567-e89b-12d3-a456-426614174001', title: 'Aviso 1', read_at: null },
        ],
        meta: { current_page: 1, last_page: 1 },
      },
    });

    vi.spyOn(notificationsClient, 'markAllRead').mockResolvedValue({
      ok: false,
      error: 'Error en base de datos',
    });

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.notifications[0].read_at).toBeNull();

    let markResult;
    await act(async () => {
      markResult = await result.current.handleMarkAllRead();
      await Promise.resolve();
    });

    expect(markResult.ok).toBe(false);
    expect(markResult.error).toBe('Error en base de datos');
    // Notification remains unread
    expect(result.current.notifications[0].read_at).toBeNull();
  });

  it('loads next page appending items and marks single notification read', async () => {
    vi.spyOn(notificationsClient, 'listNotifications')
      .mockResolvedValueOnce({
        ok: true,
        data: {
          data: [{ id: '123e4567-e89b-12d3-a456-426614174001', title: 'Aviso 1', read_at: null }],
          meta: { current_page: 1, last_page: 2 },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          data: [{ id: '123e4567-e89b-12d3-a456-426614174002', title: 'Aviso 2', read_at: null }],
          meta: { current_page: 2, last_page: 2 },
        },
      });

    vi.spyOn(notificationsClient, 'markRead').mockResolvedValue({
      ok: true,
    });

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.notifications).toHaveLength(1);

    await act(async () => {
      result.current.loadNextPage();
      await Promise.resolve();
    });

    expect(result.current.notifications).toHaveLength(2);

    await act(async () => {
      await result.current.handleMarkRead('123e4567-e89b-12d3-a456-426614174001');
      await Promise.resolve();
    });

    expect(result.current.notifications[0].read_at).toBeTruthy();
  });
});
