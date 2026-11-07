import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import { changePassword } from '../accountClient';

describe('accountClient service (Brief 45p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exige la contraseña actual', async () => {
    const spy = vi.spyOn(apiClient, 'request');

    const res = await changePassword({ currentPassword: '', password: 'Nueva123', passwordConfirmation: 'Nueva123' });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(400);
    expect(res.error).toContain('contraseña actual');
    expect(spy).not.toHaveBeenCalled();
  });

  it('exige al menos 8 caracteres en la nueva contraseña', async () => {
    const spy = vi.spyOn(apiClient, 'request');

    const res = await changePassword({ currentPassword: 'Vieja123', password: 'Corta1', passwordConfirmation: 'Corta1' });
    expect(res.ok).toBe(false);
    expect(res.error).toContain('al menos 8 caracteres');
    expect(spy).not.toHaveBeenCalled();
  });

  it('exige letras y números', async () => {
    const spy = vi.spyOn(apiClient, 'request');

    const onlyLetters = await changePassword({ currentPassword: 'Vieja123', password: 'sololetras', passwordConfirmation: 'sololetras' });
    expect(onlyLetters.ok).toBe(false);
    expect(onlyLetters.error).toContain('letras y números');

    const onlyNumbers = await changePassword({ currentPassword: 'Vieja123', password: '12345678', passwordConfirmation: '12345678' });
    expect(onlyNumbers.ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('exige que la confirmación coincida', async () => {
    const spy = vi.spyOn(apiClient, 'request');

    const res = await changePassword({ currentPassword: 'Vieja123', password: 'Nueva123', passwordConfirmation: 'Distinta123' });
    expect(res.ok).toBe(false);
    expect(res.error).toContain('no coinciden');
    expect(spy).not.toHaveBeenCalled();
  });

  it('envía PUT /me/password con los nombres que espera el motor', async () => {
    const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, status: 200, data: {} });

    const res = await changePassword({ currentPassword: 'Vieja123', password: 'Nueva123', passwordConfirmation: 'Nueva123' });

    expect(spy).toHaveBeenCalledWith('/me/password', {
      method: 'PUT',
      body: {
        current_password: 'Vieja123',
        password: 'Nueva123',
        password_confirmation: 'Nueva123',
      },
    });
    expect(res.ok).toBe(true);
  });

  it('propaga el 422 del motor', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      ok: false,
      status: 422,
      error: 'La contraseña actual no es correcta.',
      data: { message: 'La contraseña actual no es correcta.' },
    });

    const res = await changePassword({ currentPassword: 'Mala123', password: 'Nueva123', passwordConfirmation: 'Nueva123' });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(422);
    expect(res.error).toBe('La contraseña actual no es correcta.');
  });
});
