import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TeamCreateForm from '../TeamCreateForm';
import * as auth from '../../../services/auth';
import * as teamClient from '../../../services/teamClient';
import { ROLES } from '../../../services/permissions';

const withTeamManage = () => vi.spyOn(auth, 'getUser').mockReturnValue({
  id: 1,
  role: ROLES.OWNER,
  capabilities: { is_owner: true, abilities: ['team.manage'] },
});

const fillForm = () => {
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'María Salón' } });
  fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'maria@doblefilo.ualdocorp.com' } });
};

describe('TeamCreateForm (Brief 45p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('no muestra el botón sin permiso team.manage', () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({
      id: 2,
      capabilities: { abilities: ['inventory.view'] },
    });

    render(<TeamCreateForm />);

    expect(screen.queryByRole('button', { name: 'Crear cuenta' })).not.toBeInTheDocument();
  });

  it('crea la cuenta, muestra la contraseña temporal y la borra al cerrar', async () => {
    withTeamManage();
    const createSpy = vi.spyOn(teamClient, 'createMember').mockResolvedValue({
      ok: true,
      status: 201,
      data: {
        data: { id: 25, name: 'María Salón', email: 'maria@doblefilo.ualdocorp.com' },
        temporary_password: 'Temp12345',
      },
    });
    const onCreated = vi.fn();

    render(<TeamCreateForm onCreated={onCreated} />);

    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    fillForm();
    fireEvent.change(screen.getByLabelText('Cargo'), { target: { value: ROLES.LOUNGE_STAFF } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => {
      expect(screen.getByText('Temp12345')).toBeInTheDocument();
    });

    expect(createSpy).toHaveBeenCalledWith({
      name: 'María Salón',
      email: 'maria@doblefilo.ualdocorp.com',
      role: ROLES.LOUNGE_STAFF,
    });
    expect(screen.getByText(/Entrégala en persona\. No se vuelve a mostrar\./)).toBeInTheDocument();
    expect(onCreated).toHaveBeenCalledWith({ id: 25, name: 'María Salón', email: 'maria@doblefilo.ualdocorp.com' });

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(screen.queryByText('Temp12345')).not.toBeInTheDocument();

    const localValues = Object.keys(localStorage).map((key) => localStorage.getItem(key)).join(' ');
    const sessionValues = Object.keys(sessionStorage).map((key) => sessionStorage.getItem(key)).join(' ');
    expect(localValues).not.toContain('Temp12345');
    expect(sessionValues).not.toContain('Temp12345');
  });

  it('muestra el 422 del correo repetido por campo', async () => {
    withTeamManage();
    vi.spyOn(teamClient, 'createMember').mockResolvedValue({
      ok: false,
      status: 422,
      error: 'Los datos no son válidos.',
      data: { message: 'Los datos no son válidos.', errors: { email: ['Ese correo ya tiene cuenta.'] } },
    });

    render(<TeamCreateForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText('Ese correo ya tiene cuenta.')).toBeInTheDocument();
  });

  it('muestra la ayuda para correos inventados con el dominio del negocio', () => {
    withTeamManage();
    render(<TeamCreateForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(screen.getByText(/maria@doblefilo\.ualdocorp\.com/)).toBeInTheDocument();
    expect(screen.getByText(/No se envía nada a ese correo\./)).toBeInTheDocument();
  });
});
