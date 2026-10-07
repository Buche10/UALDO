import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import { login, logout, fetchMe, clearUserStorage, isAuthenticated, getToken, getUser } from '../auth';

describe('auth service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('token isolation', () => {
    it('never writes teams_token or teams_user when logging into UaldoBusiness', async () => {
      vi.spyOn(apiClient, 'request').mockImplementation((path) => {
        if (path === '/login') {
          return Promise.resolve({
            ok: true,
            status: 200,
            data: { token: 'ualdo-business-token', user: { id: 10, role: 'owner', name: 'Ana' } }
          });
        }
        if (path === '/me') {
          return Promise.resolve({
            ok: true,
            status: 200,
            data: { user: { id: 10, role: 'owner', name: 'Ana' } }
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      const res = await login('ana@restaurant.com', 'password123');
      expect(res.success).toBe(true);

      // Verify UaldoBusiness token is set
      expect(localStorage.getItem('ualdo_token')).toBe('ualdo-business-token');

      // Verify teams_token is strictly EMPTY / null
      expect(localStorage.getItem('teams_token')).toBeNull();
      expect(localStorage.getItem('teams_user')).toBeNull();
    });

    it('elimina el historial de caja del localStorage al iniciar sesion', async () => {
      const historyKey = ['ualdo', 'cash', 'close', 'history'].join('_');
      localStorage.setItem(historyKey, JSON.stringify([{ id: 1 }]));
      expect(localStorage.getItem(historyKey)).not.toBeNull();

      vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { token: 'token-test', user: { id: 10, role: 'owner', name: 'Ana' } }
      });

      await login('ana@restaurant.com', 'password123');
      expect(localStorage.getItem(historyKey)).toBeNull();
    });
  });

  describe('login scenarios and branch coverage', () => {
    it('successfully logs in when /me fails and falls back to login user data', async () => {
      vi.spyOn(apiClient, 'request').mockImplementation((path) => {
        if (path === '/login') {
          return Promise.resolve({
            ok: true,
            status: 200,
            data: { token: 'token-abc', user: { id: 15, role: 'staff', name: 'Carlos' } }
          });
        }
        if (path === '/me') {
          return Promise.resolve({
            ok: false,
            status: 500
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      const res = await login('carlos@rest.com', 'secret');
      expect(res.success).toBe(true);
      expect(res.user).toEqual({ id: 15, role: 'staff', name: 'Carlos' });
      expect(localStorage.getItem('ualdo_token')).toBe('token-abc');
      expect(localStorage.getItem('teams_token')).toBeNull();
    });

    it('rejects login when server returns error (no fallback login)', async () => {
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
    it('cleans both sessions (ualdo and teams) even if logout request throws error', async () => {
      localStorage.setItem('ualdo_token', 'active_token');
      localStorage.setItem('ualdo_user', JSON.stringify({ id: 5, role: 'owner' }));
      localStorage.setItem('teams_token', 'teams_active_token');
      localStorage.setItem('teams_user', JSON.stringify({ email: 'test@teams.com' }));
      localStorage.setItem('ualdo_chat_5', JSON.stringify([{ id: 1, content: 'chat' }]));
      localStorage.setItem('ualdo_privacy_ack_5_v1', 'true');

      vi.spyOn(apiClient, 'request').mockRejectedValueOnce(new Error('Network error on logout'));

      await logout();

      expect(localStorage.getItem('ualdo_token')).toBeNull();
      expect(localStorage.getItem('ualdo_user')).toBeNull();
      expect(localStorage.getItem('teams_token')).toBeNull();
      expect(localStorage.getItem('teams_user')).toBeNull();
      expect(localStorage.getItem('ualdo_chat_5')).toBeNull();
      expect(localStorage.getItem('ualdo_privacy_ack_5_v1')).toBeNull();
      expect(isAuthenticated()).toBe(false);
    });

    it('cleans user storage for all users when clearUserStorage is called without userId', () => {
      localStorage.setItem('ualdo_chat_1', 'msg1');
      localStorage.setItem('ualdo_chat_2', 'msg2');
      localStorage.setItem('ualdo_privacy_ack_1_v1', 'true');
      localStorage.setItem('other_key', 'keep_me');

      clearUserStorage();

      expect(localStorage.getItem('ualdo_chat_1')).toBeNull();
      expect(localStorage.getItem('ualdo_chat_2')).toBeNull();
      expect(localStorage.getItem('ualdo_privacy_ack_1_v1')).toBeNull();
      expect(localStorage.getItem('other_key')).toBe('keep_me');
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

    it('returns null and does not clear when fetchMe fails with non-401 error', async () => {
      localStorage.setItem('ualdo_token', 'valid_token');
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 500,
        error: 'Server Error'
      });

      const user = await fetchMe();
      expect(user).toBeNull();
      expect(localStorage.getItem('ualdo_token')).toBe('valid_token');
    });

    it('handles fetchMe returning user directly in result.data', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { id: 7, name: 'Direct User', role: 'staff' }
      });

      const user = await fetchMe();
      expect(user).toEqual({ id: 7, name: 'Direct User', role: 'staff' });
    });

    it('handles login with token but no user in response nor fetchMe', async () => {
      vi.spyOn(apiClient, 'request').mockImplementation((path) => {
        if (path === '/login') {
          return Promise.resolve({
            ok: true,
            status: 200,
            data: { token: 'raw-token' }
          });
        }
        if (path === '/me') {
          return Promise.resolve({ ok: false, status: 404 });
        }
        return Promise.resolve({ ok: false });
      });

      const res = await login('nouser@rest.com', 'pass');
      expect(res.success).toBe(true);
      expect(res.user).toBeNull();
      expect(res.token).toBe('raw-token');
    });

    it('exposes getToken and getUser helpers', () => {
      localStorage.setItem('ualdo_token', 'test_tok');
      localStorage.setItem('ualdo_user', JSON.stringify({ id: 99, role: 'staff' }));

      expect(getToken()).toBe('test_tok');
      expect(getUser()).toEqual({ id: 99, role: 'staff' });
    });

    it('handles storage errors inside clearUserStorage safely', () => {
      const origRemove = localStorage.removeItem;
      localStorage.removeItem = () => { throw new Error('Storage disabled'); };

      expect(() => clearUserStorage('123')).not.toThrow();

      localStorage.removeItem = origRemove;
    });
  });
});

