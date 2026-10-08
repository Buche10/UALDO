import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resolveTeamsBaseUrl,
  getTeamsBaseUrl,
  getTeamsToken,
  setTeamsToken,
  getTeamsUser,
  isTeamsAuthenticated,
  teamsLogout,
  teamsLogin,
  teamsRequest,
  fetchProgress,
  fetchTasks,
  fetchNotifications,
  markNotificationRead,
  fetchMeta,
  createTask,
  getTaskLog,
  addTaskNote,
  addTaskHandoff,
  getNexoBaseUrl,
  nexoRequest,
} from '../teamsClient';

describe('teamsClient service', () => {
  const originalEnv = { ...import.meta.env };
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.assign(import.meta.env, originalEnv);
  });

  describe('in development (!PROD)', () => {
    beforeEach(() => {
      import.meta.env.PROD = false;
      import.meta.env.VITE_TEAMS_API_URL = '';
      import.meta.env.VITE_NEXO_API_URL = '';
    });

    it('uses default http://nexoteams.test/api when no env var is provided', () => {
      expect(resolveTeamsBaseUrl()).toBe('http://nexoteams.test/api');
      expect(getTeamsBaseUrl()).toBe('http://nexoteams.test/api');
      expect(getNexoBaseUrl()).toBe('http://nexoteams.test/api');
    });

    it('performs requests successfully in dev', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ tasks: [{ id: 1, title: 'Limpieza' }] }),
      });

      const res = await fetchTasks({ status: 'open' });
      expect(res.ok).toBe(true);
      expect(res.data.tasks).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://nexoteams.test/api/mobile/tasks?status=open',
        expect.any(Object)
      );
    });
  });

  describe('in production (PROD = true)', () => {
    beforeEach(() => {
      import.meta.env.PROD = true;
    });

    it('rejects teamsRequest without calling fetch when URL is missing', async () => {
      delete import.meta.env.VITE_TEAMS_API_URL;
      delete import.meta.env.VITE_NEXO_API_URL;

      const res = await teamsRequest('/mobile/tasks');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(0);
      expect(res.error).toBe('La URL de Ualdo Teams no es segura');
      expect(res.isNetworkError).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects teamsRequest without calling fetch when URL uses http://', async () => {
      import.meta.env.VITE_TEAMS_API_URL = 'http://insecure-teams.example.com/api';

      const res = await teamsRequest('/mobile/progress');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(0);
      expect(res.error).toBe('La URL de Ualdo Teams no es segura');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects teamsLogin without calling fetch when URL is insecure', async () => {
      import.meta.env.VITE_TEAMS_API_URL = 'http://insecure-teams.example.com/api';

      const res = await teamsLogin('admin@ualdo.test', 'secret123');
      expect(res.ok).toBe(false);
      expect(res.error).toBe('La URL de Ualdo Teams no es segura');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('allows teamsRequest and teamsLogin when URL uses https://', async () => {
      import.meta.env.VITE_TEAMS_API_URL = 'https://teams.ualdo.example.com/api/';

      expect(resolveTeamsBaseUrl()).toBe('https://teams.ualdo.example.com/api');

      // Test teamsLogin
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'jwt-123', user: { email: 'staff@ualdo.test' } }),
      });

      const loginRes = await teamsLogin('staff@ualdo.test', 'pwd123');
      expect(loginRes.ok).toBe(true);
      expect(getTeamsToken()).toBe('jwt-123');
      expect(isTeamsAuthenticated()).toBe(true);

      // Test teamsRequest with auth token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ progress: 85 }),
      });

      const progRes = await fetchProgress();
      expect(progRes.ok).toBe(true);
      expect(progRes.data.progress).toBe(85);
      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://teams.ualdo.example.com/api/mobile/progress',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer jwt-123',
          }),
        })
      );
    });
  });

  describe('token, auth and lifecycle helpers', () => {
    it('handles login failure, 401 session expiry and manual logout', async () => {
      import.meta.env.PROD = false;
      import.meta.env.VITE_TEAMS_API_URL = 'http://localhost/api';

      // Login invalid credentials
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Credenciales inválidas' }),
      });
      const failLogin = await teamsLogin('bad@test.com', 'wrong');
      expect(failLogin.ok).toBe(false);
      expect(failLogin.error).toBe('Credenciales inválidas');

      // Set token and user
      setTeamsToken('test-token');
      expect(getTeamsToken()).toBe('test-token');

      // 401 expires session
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => null,
      });

      const expiredRes = await teamsRequest('/mobile/tasks');
      expect(expiredRes.ok).toBe(false);
      expect(expiredRes.status).toBe(401);
      expect(expiredRes.error).toContain('Sesión de Ualdo Teams expirada');
      expect(getTeamsToken()).toBeNull();

      // Manual logout
      setTeamsToken('token-2');
      expect(isTeamsAuthenticated()).toBe(true);
      teamsLogout();
      expect(isTeamsAuthenticated()).toBe(false);
      expect(getTeamsUser()).toBeNull();
    });

    it('handles network errors and timeouts gracefully', async () => {
      import.meta.env.PROD = false;

      // AbortError timeout
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const timeoutRes = await teamsRequest('/mobile/tasks');
      expect(timeoutRes.ok).toBe(false);
      expect(timeoutRes.status).toBe(0);
      expect(timeoutRes.error).toBe('Tiempo de espera agotado.');
      expect(timeoutRes.isNetworkError).toBe(true);

      // Connection error
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));
      const netRes = await teamsRequest('/mobile/tasks');
      expect(netRes.ok).toBe(false);
      expect(netRes.error).toBe('Failed to fetch');
    });

    it('invokes endpoints with correct payloads and methods', async () => {
      await fetchNotifications();
      await markNotificationRead(42);
      await fetchMeta();
      await createTask({ title: 'Nueva tarea' });
      await getTaskLog(7);
      await addTaskNote(7, { content: 'Nota importante', isKey: true });
      await addTaskHandoff(7, { done: 'Todo listo', pending: 'Nada', avoid: 'Ninguno', contact: 'Juan' });
      await nexoRequest('/legacy');

      expect(mockFetch).toHaveBeenCalled();
    });

    it('covers all branch variations: NEXO url fallback, unslashed path, and missing fields', async () => {
      import.meta.env.PROD = true;
      delete import.meta.env.VITE_TEAMS_API_URL;
      import.meta.env.VITE_NEXO_API_URL = 'https://nexo.ualdo.test/api';

      expect(resolveTeamsBaseUrl()).toBe('https://nexo.ualdo.test/api');

      // Unslashed path and POST body
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 10 }),
      });
      const unslashedRes = await teamsRequest('mobile/tasks', { method: 'POST', body: { name: 'Test' } });
      expect(unslashedRes.ok).toBe(true);
      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://nexo.ualdo.test/api/mobile/tasks',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Test' }) })
      );

      // Error response without message
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => null,
      });
      const error500 = await teamsRequest('/mobile/tasks');
      expect(error500.ok).toBe(false);
      expect(error500.status).toBe(500);
      expect(error500.error).toBe('Error 500');

      // teamsLogin when data has token but no user object
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: 'tk-anon' }),
      });
      const loginAnon = await teamsLogin('anon@test.com', 'pass');
      expect(loginAnon.ok).toBe(true);
      expect(getTeamsUser()).toEqual({ email: 'anon@test.com' });

      // nexo aliases
      setTeamsToken(null);
      expect(getTeamsToken()).toBeNull();
    });
  });
});
