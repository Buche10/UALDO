import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AccountSection from '../AccountSection';
import * as auth from '../../../services/auth';

describe('AccountSection (Brief 34bp_fix)', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete window.location;
    window.location = { ...originalLocation, reload: vi.fn() };
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.restoreAllMocks();
  });

  it('sin sesión muestra el aviso de no hay sesión activa', () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(false);
    vi.spyOn(auth, 'getUser').mockReturnValue(null);

    render(<AccountSection />);

    expect(screen.getByText('Cuenta')).toBeInTheDocument();
    expect(screen.getByText('No hay sesión activa. Ingresa desde el módulo correspondiente.')).toBeInTheDocument();
    expect(screen.queryByText('Cerrar sesión')).not.toBeInTheDocument();
    expect(screen.queryByText('Usuario Ualdo')).not.toBeInTheDocument();
    expect(screen.queryByText('admin@ualdo.app')).not.toBeInTheDocument();
  });

  it('con sesión muestra únicamente datos reales y ningún texto inventado', () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(auth, 'getUser').mockReturnValue({
      name: 'Carlos Buch',
      business_name: 'Parrilla Central',
      email: 'carlos@parrilla.com',
    });

    render(<AccountSection />);

    expect(screen.getByText('Carlos Buch')).toBeInTheDocument();
    expect(screen.getByText('Parrilla Central')).toBeInTheDocument();
    expect(screen.getByText('(carlos@parrilla.com)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();

    expect(screen.queryByText('Usuario Ualdo')).not.toBeInTheDocument();
    expect(screen.queryByText('admin@ualdo.app')).not.toBeInTheDocument();
    expect(screen.queryByText('Negocio Principal')).not.toBeInTheDocument();
    expect(screen.queryByText('Administrador')).not.toBeInTheDocument();
  });

  it('muestra el role_title solo si existe', () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(auth, 'getUser').mockReturnValue({
      name: 'Ana López',
      role_title: 'Jefa de cocina',
    });

    render(<AccountSection />);

    expect(screen.getByText('Ana López')).toBeInTheDocument();
    expect(screen.getByText('Jefa de cocina')).toBeInTheDocument();
    expect(screen.queryByText('Administrador')).not.toBeInTheDocument();
  });

  it('cerrar sesión pide confirmación y espera a logout antes de recargar', async () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(auth, 'getUser').mockReturnValue({ name: 'Carlos Buch' });

    let resolveLogout;
    const logoutPromise = new Promise((resolve) => {
      resolveLogout = resolve;
    });
    const logoutSpy = vi.spyOn(auth, 'logout').mockReturnValue(logoutPromise);

    render(<AccountSection />);

    const openConfirmBtn = screen.getByRole('button', { name: 'Cerrar sesión' });
    fireEvent.click(openConfirmBtn);

    expect(screen.getByText('¿Cerrar sesión?')).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: 'Sí, cerrar' });
    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    expect(confirmBtn).toBeInTheDocument();
    expect(cancelBtn).toBeInTheDocument();
    expect(logoutSpy).not.toHaveBeenCalled();

    // Probar cancelar primero
    fireEvent.click(cancelBtn);
    expect(screen.queryByText('¿Cerrar sesión?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();

    // Abrir de nuevo y confirmar
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sí, cerrar' }));

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    // Antes de resolver logout, no se ha recargado la ventana y el botón está deshabilitado
    expect(window.location.reload).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Cerrando...' })).toBeDisabled();

    // Resolver logout
    resolveLogout();

    await waitFor(() => {
      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });
  });
});
