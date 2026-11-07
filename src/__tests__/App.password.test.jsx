import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import * as auth from '../services/auth';
import * as apiClient from '../services/apiClient';
import * as accountClient from '../services/accountClient';

const baseUser = {
  id: 1,
  name: 'Carlos Dueño',
  role: 'owner',
  capabilities: { is_owner: true, role: 'owner', abilities: [] },
};

const mockRequests = () => vi.spyOn(apiClient, 'request').mockImplementation((path) => {
  if (path === '/notifications/unread-count') {
    return Promise.resolve({ ok: true, data: { count: 0 } });
  }
  return Promise.resolve({ ok: true, data: {} });
});

describe('App cambio obligatorio de contraseña (Brief 45p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('muestra ChangePasswordView si GET /me trae must_change_password', async () => {
    const temporaryUser = { ...baseUser, must_change_password: true };
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(auth, 'getUser').mockReturnValue(baseUser);
    vi.spyOn(auth, 'fetchMe').mockResolvedValue(temporaryUser);
    mockRequests();

    render(<App />);

    expect(await screen.findByText('Cambia tu contraseña temporal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salir' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Mensaje para el asistente')).not.toBeInTheDocument();
  });

  it('muestra ChangePasswordView al recibir el evento 403 password_change_required', async () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(auth, 'getUser').mockReturnValue(baseUser);
    vi.spyOn(auth, 'fetchMe').mockResolvedValue(baseUser);
    mockRequests();

    render(<App />);
    await screen.findByLabelText('Mensaje para el asistente');

    window.dispatchEvent(new CustomEvent(apiClient.PASSWORD_CHANGE_REQUIRED_EVENT, {
      detail: { message: apiClient.PASSWORD_CHANGE_REQUIRED_MESSAGE },
    }));

    await waitFor(() => {
      expect(screen.getByText('Cambia tu contraseña temporal')).toBeInTheDocument();
    });
  });

  it('al guardar refresca el usuario con GET /me y entra a la app', async () => {
    const temporaryUser = { ...baseUser, must_change_password: true };
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(auth, 'getUser').mockReturnValue(baseUser);
    const fetchMeSpy = vi.spyOn(auth, 'fetchMe')
      .mockResolvedValueOnce(temporaryUser)
      .mockResolvedValueOnce(baseUser);
    vi.spyOn(accountClient, 'changePassword').mockResolvedValue({ ok: true, status: 200, data: {} });
    mockRequests();

    render(<App />);
    await screen.findByText('Cambia tu contraseña temporal');

    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'Temp1234' } });
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'Nueva1234' } });
    fireEvent.change(screen.getByLabelText('Repite la nueva contraseña'), { target: { value: 'Nueva1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    expect(await screen.findByLabelText('Mensaje para el asistente')).toBeInTheDocument();
    expect(fetchMeSpy).toHaveBeenCalledTimes(2);
  });
});
