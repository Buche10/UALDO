import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  getPreferences,
  updatePreferences,
} from '../notificationsClient';

describe('notificationsClient service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('listNotifications', () => {
    it('applies query parameters for category and unread filter', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: [] },
      });

      await listNotifications({ category: 'pedidos', unread: 1, page: 2 });
      expect(spy).toHaveBeenCalledTimes(1);
      const url = spy.mock.calls[0][0];
      expect(url).toContain('/notifications?');
      expect(url).toContain('category=pedidos');
      expect(url).toContain('unread=1');
      expect(url).toContain('page=2');
    });
  });

  describe('getUnreadCount', () => {
    it('calls unread count endpoint and extracts count', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { count: 7 },
      });

      const res = await getUnreadCount();
      expect(spy).toHaveBeenCalledWith('/notifications/unread-count');
      expect(res.data.count).toBe(7);
    });

    it('handles fallback when count is 0 or network error', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: false,
        error: 'Network failure',
      });

      const res = await getUnreadCount();
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Network failure');
    });
  });

  describe('markRead', () => {
    it('rejects invalid non-UUID notification id without network call', async () => {
      const spy = vi.spyOn(apiClient, 'request');

      const res = await markRead('1234');
      expect(res.ok).toBe(false);
      expect(res.error).toContain('inválido');
      expect(spy).not.toHaveBeenCalled();
    });

    it('marks read with valid UUID', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { message: 'Marcada como leida' },
      });

      const res = await markRead(validUuid);
      expect(res.ok).toBe(true);
      expect(spy).toHaveBeenCalledWith(`/notifications/${validUuid}/read`, {
        method: 'POST',
      });
    });
  });

  describe('markAllRead', () => {
    it('sends POST to /notifications/read-all with optional category', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { affected: 4 },
      });

      await markAllRead('inventario');
      expect(spy).toHaveBeenCalledWith('/notifications/read-all', {
        method: 'POST',
        body: { category: 'inventario' },
      });
    });

    it('sends POST without body when category is null', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { affected: 5 },
      });

      await markAllRead(null);
      expect(spy).toHaveBeenCalledWith('/notifications/read-all', {
        method: 'POST',
      });
    });
  });

  describe('preferences', () => {
    it('retrieves and updates user preferences', async () => {
      const spy = vi.spyOn(apiClient, 'request')
        .mockResolvedValueOnce({ ok: true, data: { pedidos: true, inventario: false } })
        .mockResolvedValueOnce({ ok: true, data: { pedidos: false, inventario: false } });

      const prefs = await getPreferences();
      expect(prefs.ok).toBe(true);
      expect(spy).toHaveBeenNthCalledWith(1, '/notifications/preferences');

      const update = await updatePreferences([
        { category: 'pedidos', enabled: false },
        { category: 'inventario', enabled: false },
      ]);
      expect(update.ok).toBe(true);
      expect(spy).toHaveBeenNthCalledWith(2, '/notifications/preferences', {
        method: 'PUT',
        body: {
          preferences: [
            { category: 'pedidos', enabled: false },
            { category: 'inventario', enabled: false },
          ],
        },
      });
    });

    it('rejects invalid preference list or category without network call', async () => {
      const spy = vi.spyOn(apiClient, 'request');

      const resMap = await updatePreferences({ pedidos: false });
      expect(resMap.ok).toBe(false);
      expect(resMap.status).toBe(422);

      const resBadCat = await updatePreferences([{ category: 'invalida', enabled: true }]);
      expect(resBadCat.ok).toBe(false);
      expect(resBadCat.status).toBe(422);

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
