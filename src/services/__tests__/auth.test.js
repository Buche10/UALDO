import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import { login, logout, fetchMe, clearUserStorage, isAuthenticated } from '../auth';

describe('auth service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('successfully logs in when server returns 200 and token', async () => {
      vi.spyOn(apiClient, 'request').mockImplementation((path) => {
        if (path === '/login') {
          return Promise.resolve({
            ok: true,
            status: 200,
            data: { token: 'server-valid-token', user: { id: 10, role: 'staff', name: 'Carlos' } }
          });
        }
        if (path === '/me') {
          return Promise.resolve({
            ok: true,
            status: 200,
            data: { user: { id: 10, role: 'staff', name: 'Carlos' } }
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      const result = await login('carlos@restaurant.com', 'secret');
      expect(result.success).toBe(true);
      expect(result.token).toBe('server-valid-token');
      expect(result.user.role).toBe('staff');
      expect(localStorage.getItem('ualdo_token')).toBe('server-valid-token');
      expect(isAuthenticated()).toBe(true);
    });

    it('rejects demo credentials if server returns error (no fallback login)', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 401,
        error: 'Credenciales inválidas'
      });

      const result = await login('admin@doblefilo.com', 'admin123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Correo o contraseña incorrectos.');
      expect(localStorage.getItem('ualdo_token')).toBeNull();
      expect(isAuthenticated()).toBe(false);
    });

    it('handles network error cleanly', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 0,
        isNetworkError: true,
        error: 'Network failure'
      });

      const result = await login('any@user.com', 'password');
      expect(result.success).toBe(false);
      expect(result.error).toContain('No hay conexión con Ualdo');
    });
  });

  describe('logout and cleanup', () => {
    it('cleans token, user, chat and privacy ack on logout', async () => {
      localStorage.setItem('ualdo_token', 'active_token');
      localStorage.setItem('ualdo_user', JSON.stringify({ id: 5, role: 'owner' }));
      localStorage.setItem('ualdo_chat_5', JSON.stringify([{ id: 1, content: 'chat' }]));
      localStorage.setItem('ualdo_privacy_ack_5_v1', 'true');

      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({ ok: true, status: 200 });

      await logout();

      expect(localStorage.getItem('ualdo_token')).toBeNull();
      expect(localStorage.getItem('ualdo_user')).toBeNull();
      expect(localStorage.getItem('ualdo_chat_5')).toBeNull();
      expect(localStorage.getItem('ualdo_privacy_ack_5_v1')).toBeNull();
      expect(isAuthenticated()).toBe(false);
    });

    it('cleans session on 401 response from fetchMe', async () => {
      localStorage.setItem('ualdo_token', 'expired_token');
      localStorage.setItem('ualdo_user', JSON.stringify({ id: 8 }));
      localStorage.setItem('ualdo_chat_8', 'messages');

      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 401,
        error: 'Unauthorized'
      });

      const user = await fetchMe();
      expect(user).toBeNull();
      expect(localStorage.getItem('ualdo_token')).toBeNull();
      expect(localStorage.getItem('ualdo_chat_8')).toBeNull();
    });
  });
});
