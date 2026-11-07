import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginView from '../LoginView';
import * as auth from '../../services/auth';

const submitLogin = () => {
  fireEvent.change(screen.getByPlaceholderText('tu@negocio.com'), { target: { value: 'maria@doblefilo.ec' } });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Temp1234' } });
  fireEvent.click(screen.getByRole('button', { name: /^Iniciar Sesión$/ }));
};

describe('LoginView (Brief 45p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra el mensaje del motor cuando la cuenta está desactivada', async () => {
    vi.spyOn(auth, 'login').mockResolvedValue({
      success: false,
      error: 'Tu cuenta está desactivada. Pide al dueño que la reactive.',
    });

    render(<LoginView />);
    submitLogin();

    expect(await screen.findByRole('alert')).toHaveTextContent('Tu cuenta está desactivada. Pide al dueño que la reactive.');
  });

  it('mantiene los campos de acceso con tipo y autocompletado correctos', () => {
    render(<LoginView />);

    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'password');
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByPlaceholderText('tu@negocio.com')).toHaveAttribute('autocomplete', 'email');
  });

  it('avisa cuando faltan correo o contraseña sin llamar al motor', () => {
    const spy = vi.spyOn(auth, 'login');

    render(<LoginView />);
    fireEvent.submit(screen.getByRole('button', { name: /^Iniciar Sesión$/ }).closest('form'));

    expect(screen.getByRole('alert')).toHaveTextContent('Por favor ingresa tu correo y contraseña.');
    expect(spy).not.toHaveBeenCalled();
  });

  it('llama a onLoginSuccess con el usuario cuando el acceso es correcto', async () => {
    const onLoginSuccess = vi.fn();
    vi.spyOn(auth, 'login').mockResolvedValue({
      success: true,
      token: 'token-1',
      user: { id: 5, name: 'María', must_change_password: true },
    });

    render(<LoginView onLoginSuccess={onLoginSuccess} />);
    submitLogin();

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalledWith({ id: 5, name: 'María', must_change_password: true }, 'token-1');
    });
  });
});
