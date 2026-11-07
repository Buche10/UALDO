import { describe, it, expect, vi, afterEach } from 'vitest';
import { request, PASSWORD_CHANGE_REQUIRED_EVENT, PASSWORD_CHANGE_REQUIRED_MESSAGE } from '../apiClient';

const mockResponse = (status, body) => ({
  status,
  ok: status >= 200 && status < 300,
  headers: { get: () => 'application/json' },
  json: async () => body,
});

describe('apiClient password_change_required (Brief 45p)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('emite ualdo:password_change_required ante un 403 con ese código', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(403, {
      code: 'password_change_required',
      message: 'Cambia tu contraseña temporal para continuar.',
    })));

    const listener = vi.fn();
    window.addEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, listener);

    const res = await request('/team');

    expect(res.ok).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toBe('Cambia tu contraseña temporal para continuar.');
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, listener);
  });

  it('no emite el evento para otros 403', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(403, {
      message: 'Tu cuenta está desactivada.',
    })));

    const listener = vi.fn();
    window.addEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, listener);

    const res = await request('/login', { method: 'POST', body: {} });

    expect(res.ok).toBe(false);
    expect(res.status).toBe(403);
    expect(listener).not.toHaveBeenCalled();

    window.removeEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, listener);
  });

  it('expone el mensaje del cambio obligatorio', () => {
    expect(PASSWORD_CHANGE_REQUIRED_MESSAGE).toBe('Cambia tu contraseña temporal para continuar.');
  });
});
