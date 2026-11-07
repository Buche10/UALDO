import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChangePasswordView from '../ChangePasswordView';
import * as accountClient from '../../services/accountClient';

const fillPasswords = ({ current = 'Temp1234', password = 'Nueva1234', confirmation = 'Nueva1234' } = {}) => {
  fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: current } });
  fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Repite la nueva contraseña'), { target: { value: confirmation } });
};

describe('ChangePasswordView (Brief 45p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('usa campos de contraseña con el autocompletado correcto', () => {
    render(<ChangePasswordView />);

    expect(screen.getByLabelText('Contraseña actual')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Contraseña actual')).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByLabelText('Nueva contraseña')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Nueva contraseña')).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByLabelText('Repite la nueva contraseña')).toHaveAttribute('type', 'password');
    expect(screen.getByText('Mínimo 8 caracteres.')).toBeInTheDocument();
    expect(screen.getByText('Debe incluir letras y números.')).toBeInTheDocument();
  });

  it('valida la longitud mínima de la nueva contraseña', () => {
    const spy = vi.spyOn(accountClient, 'changePassword');
    render(<ChangePasswordView />);

    fillPasswords({ password: 'Corta1', confirmation: 'Corta1' });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    expect(screen.getByRole('alert')).toHaveTextContent('al menos 8 caracteres');
    expect(spy).not.toHaveBeenCalled();
  });

  it('valida que la confirmación coincida', () => {
    const spy = vi.spyOn(accountClient, 'changePassword');
    render(<ChangePasswordView />);

    fillPasswords({ confirmation: 'Otra12345' });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    expect(screen.getByRole('alert')).toHaveTextContent('no coinciden');
    expect(spy).not.toHaveBeenCalled();
  });

  it('envía el cambio y avisa al padre cuando el motor responde bien', async () => {
    const spy = vi.spyOn(accountClient, 'changePassword').mockResolvedValue({ ok: true, status: 200, data: {} });
    const onSuccess = vi.fn().mockResolvedValue(undefined);

    render(<ChangePasswordView onSuccess={onSuccess} />);
    fillPasswords();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({
        currentPassword: 'Temp1234',
        password: 'Nueva1234',
        passwordConfirmation: 'Nueva1234',
      });
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);

    const localValues = Object.keys(localStorage).map((key) => localStorage.getItem(key)).join(' ');
    expect(localValues).not.toContain('Nueva1234');
    expect(localValues).not.toContain('Temp1234');
  });

  it('muestra el error 422 del motor', async () => {
    vi.spyOn(accountClient, 'changePassword').mockResolvedValue({
      ok: false,
      status: 422,
      error: 'La contraseña actual no es correcta.',
      data: { message: 'La contraseña actual no es correcta.' },
    });

    render(<ChangePasswordView />);
    fillPasswords({ current: 'Mala1234' });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La contraseña actual no es correcta.');
  });
});
