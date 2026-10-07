import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnreadCount } from '../useUnreadCount';
import * as notificationsClient from '../../services/notificationsClient';
import * as auth from '../../services/auth';

describe('useUnreadCount hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('polls every 60s when enabled and visible', async () => {
    const spy = vi.spyOn(notificationsClient, 'getUnreadCount').mockResolvedValue({
      ok: true,
      count: 3,
    });

    const { result } = renderHook(() => useUnreadCount({ enabled: true }));

    // Immediate first fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.unreadCount).toBe(3);
    expect(spy).toHaveBeenCalledTimes(1);

    // Advance 60s
    await act(async () => {
      vi.advanceTimersByTime(60000);
      await Promise.resolve();
    });

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('pauses polling when document is hidden', async () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });

    const spy = vi.spyOn(notificationsClient, 'getUnreadCount').mockResolvedValue({
      ok: true,
      count: 1,
    });

    renderHook(() => useUnreadCount({ enabled: true }));

    // Should not fetch when hidden on mount
    await act(async () => {
      await Promise.resolve();
    });

    expect(spy).not.toHaveBeenCalled();

    // Advance 120s while still hidden
    await act(async () => {
      vi.advanceTimersByTime(120000);
      await Promise.resolve();
    });

    expect(spy).not.toHaveBeenCalled();

    // Become visible: triggers immediate fetch
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('applies exponential backoff on network error and resets on success', async () => {
    const spy = vi.spyOn(notificationsClient, 'getUnreadCount')
      .mockResolvedValueOnce({ ok: false, isNetworkError: true, count: 0 }) // attempt 1: backoff -> 120s
      .mockResolvedValueOnce({ ok: false, isNetworkError: true, count: 0 }) // attempt 2: backoff -> 240s
      .mockResolvedValueOnce({ ok: true, count: 5 });                      // attempt 3: success -> 60s

    const { result } = renderHook(() => useUnreadCount({ enabled: true }));

    // Initial fetch (fails)
    await act(async () => {
      await Promise.resolve();
    });
    expect(spy).toHaveBeenCalledTimes(1);

    // After 60s, nothing yet because next retry is at 120s
    await act(async () => {
      vi.advanceTimersByTime(60000);
      await Promise.resolve();
    });
    expect(spy).toHaveBeenCalledTimes(1);

    // After another 60s (total 120s): second call fires
    await act(async () => {
      vi.advanceTimersByTime(60000);
      await Promise.resolve();
    });
    expect(spy).toHaveBeenCalledTimes(2);

    // After 240s: third call fires and succeeds
    await act(async () => {
      vi.advanceTimersByTime(240000);
      await Promise.resolve();
    });
    expect(spy).toHaveBeenCalledTimes(3);
    expect(result.current.unreadCount).toBe(5);

    // Resets back to 60s on success: after 60s fires again
    await act(async () => {
      vi.advanceTimersByTime(60000);
      await Promise.resolve();
    });
    expect(spy).toHaveBeenCalledTimes(4);
  });

  it('stops polling on ualdo:unauthorized event and sets unreadCount to 0', async () => {
    const spy = vi.spyOn(notificationsClient, 'getUnreadCount').mockResolvedValue({
      ok: true,
      count: 4,
    });

    const { result } = renderHook(() => useUnreadCount({ enabled: true }));

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.unreadCount).toBe(4);
    expect(spy).toHaveBeenCalledTimes(1);

    // Dispatch unauthorized event
    await act(async () => {
      window.dispatchEvent(new CustomEvent('ualdo:unauthorized'));
    });

    expect(result.current.unreadCount).toBe(0);

    // Advancing timers should not trigger further requests
    await act(async () => {
      vi.advanceTimersByTime(120000);
      await Promise.resolve();
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
