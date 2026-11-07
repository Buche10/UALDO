import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TeamSection from '../TeamSection';
import * as teamClient from '../../../services/teamClient';
import { ROLES, ROLE_LABELS } from '../../../services/permissions';

const sampleMembers = [
  {
    id: 1,
    name: 'Carlos Bucheli',
    email: 'carlos@doblefilo.ec',
    role: ROLES.OWNER,
    role_label: ROLE_LABELS.owner,
    area: null,
    is_active: true,
  },
  {
    id: 15,
    name: 'Manuel Cedeño',
    email: 'manuel@doblefilo.ec',
    role: ROLES.KITCHEN_HEAD,
    role_label: ROLE_LABELS.kitchen_head,
    area: 'kitchen',
    is_active: true,
  },
];

describe('TeamSection component (Brief 30p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lista los miembros del equipo con su nombre, cargo y área', async () => {
    vi.spyOn(teamClient, 'listTeam').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        data: sampleMembers,
        meta: { current_page: 1, last_page: 1 },
      },
    });

    render(<TeamSection />);

    expect(screen.getByText('Cargando equipo...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Carlos Bucheli')).toBeInTheDocument();
      expect(screen.getByText('Manuel Cedeño')).toBeInTheDocument();
    });

    expect(screen.getByText(/carlos@doblefilo\.ec · Todas las áreas/i)).toBeInTheDocument();
    expect(screen.getByText(/manuel@doblefilo\.ec · Cocina/i)).toBeInTheDocument();
  });

  it('el cambio de cargo pide confirmación en dos pasos y llama a updateRole', async () => {
    vi.spyOn(teamClient, 'listTeam').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        data: sampleMembers,
        meta: { current_page: 1, last_page: 1 },
      },
    });

    const updateSpy = vi.spyOn(teamClient, 'updateRole').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        data: {
          ...sampleMembers[1],
          role: ROLES.ADMIN,
          role_label: ROLE_LABELS.admin,
        },
      },
    });

    render(<TeamSection />);

    await waitFor(() => {
      expect(screen.getByText('Manuel Cedeño')).toBeInTheDocument();
    });

    const select = screen.getByLabelText('Cargo de Manuel Cedeño');
    expect(select.value).toBe(ROLES.KITCHEN_HEAD);

    // Paso 1: Seleccionar un nuevo rol
    fireEvent.change(select, { target: { value: ROLES.ADMIN } });

    // Mensaje de confirmación en dos pasos
    expect(
      screen.getByText('Manuel Cedeño pasará a Administración. Tendrá que volver a iniciar sesión.')
    ).toBeInTheDocument();
    expect(updateSpy).not.toHaveBeenCalled();

    // Paso 2: Confirmar el cambio
    const confirmBtn = screen.getByRole('button', { name: 'Confirmar' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(15, ROLES.ADMIN);
    });

    // El diálogo de confirmación desaparece tras éxito
    expect(
      screen.queryByText('Manuel Cedeño pasará a Administración. Tendrá que volver a iniciar sesión.')
    ).not.toBeInTheDocument();
  });

  it('permite cancelar la confirmación del cambio de cargo', async () => {
    vi.spyOn(teamClient, 'listTeam').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        data: sampleMembers,
        meta: { current_page: 1, last_page: 1 },
      },
    });

    const updateSpy = vi.spyOn(teamClient, 'updateRole');

    render(<TeamSection />);

    await waitFor(() => {
      expect(screen.getByText('Manuel Cedeño')).toBeInTheDocument();
    });

    const select = screen.getByLabelText('Cargo de Manuel Cedeño');
    fireEvent.change(select, { target: { value: ROLES.LOUNGE_HEAD } });

    expect(
      screen.getByText('Manuel Cedeño pasará a Jefe de salón. Tendrá que volver a iniciar sesión.')
    ).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelBtn);

    expect(
      screen.queryByText('Manuel Cedeño pasará a Jefe de salón. Tendrá que volver a iniciar sesión.')
    ).not.toBeInTheDocument();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('muestra el 422 del motor ("El negocio debe tener al menos un dueño.") tal cual', async () => {
    vi.spyOn(teamClient, 'listTeam').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        data: sampleMembers,
        meta: { current_page: 1, last_page: 1 },
      },
    });

    vi.spyOn(teamClient, 'updateRole').mockResolvedValue({
      ok: false,
      status: 422,
      error: 'El negocio debe tener al menos un dueño.',
      data: {
        message: 'El negocio debe tener al menos un dueño.',
        errors: { role: ['El negocio debe tener al menos un dueño.'] },
      },
    });

    render(<TeamSection />);

    await waitFor(() => {
      expect(screen.getByText('Carlos Bucheli')).toBeInTheDocument();
    });

    const select = screen.getByLabelText('Cargo de Carlos Bucheli');
    fireEvent.change(select, { target: { value: ROLES.ADMIN } });

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('El negocio debe tener al menos un dueño.')).toBeInTheDocument();
    });
  });

  it('filtra por activas, desactivadas y todas (Brief 45p)', async () => {
    const listSpy = vi.spyOn(teamClient, 'listTeam').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        data: sampleMembers,
        meta: { current_page: 1, last_page: 1 },
      },
    });

    render(<TeamSection />);

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(1, 'activos');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Desactivadas' }));

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(1, 'inactivos');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Todas' }));

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(1, 'todos');
    });
  });
});
