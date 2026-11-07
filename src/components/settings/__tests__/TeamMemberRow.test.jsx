import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TeamMemberRow from '../TeamMemberRow';
import * as auth from '../../../services/auth';
import * as teamClient from '../../../services/teamClient';
import { ROLES } from '../../../services/permissions';

const member = {
  id: 15,
  name: 'Manuel Cedeño',
  email: 'manuel@doblefilo.ec',
  role: ROLES.KITCHEN_HEAD,
  role_label: 'Jefe de cocina',
  area: 'kitchen',
  is_active: true,
  must_change_password: false,
};

const openActions = (name) => {
  fireEvent.click(screen.getByRole('button', { name: `Acciones para ${name}` }));
};

describe('TeamMemberRow acciones de cuenta (Brief 45p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(auth, 'getUser').mockReturnValue({ id: 1, role: ROLES.OWNER, capabilities: { is_owner: true } });
  });

  it('muestra las etiquetas de cuenta desactivada y contraseña pendiente', () => {
    render(<TeamMemberRow member={{ ...member, is_active: false, must_change_password: true }} />);

    expect(screen.getByText('Desactivada')).toBeInTheDocument();
    expect(screen.getByText('Debe cambiar contraseña')).toBeInTheDocument();
  });

  it('desactivar pide confirmación antes de llamar al motor', async () => {
    const deactivateSpy = vi.spyOn(teamClient, 'deactivateMember').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: { ...member, is_active: false } },
    });
    const onMemberUpdated = vi.fn();

    render(<TeamMemberRow member={member} onMemberUpdated={onMemberUpdated} />);

    openActions('Manuel Cedeño');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Desactivar' }));

    expect(screen.getByText('Manuel Cedeño ya no podrá entrar. Puedes reactivarla después.')).toBeInTheDocument();
    expect(deactivateSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Sí, desactivar' }));

    await waitFor(() => {
      expect(deactivateSpy).toHaveBeenCalledWith(15);
    });
    expect(onMemberUpdated).toHaveBeenCalled();
  });

  it('no muestra Desactivar en la propia fila del usuario', () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({ id: 15, role: ROLES.KITCHEN_HEAD, capabilities: {} });

    render(<TeamMemberRow member={member} />);

    openActions('Manuel Cedeño');
    expect(screen.getByRole('menuitem', { name: 'Restablecer contraseña' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Desactivar' })).not.toBeInTheDocument();
  });

  it('restablecer abre el diálogo con la contraseña temporal', async () => {
    vi.spyOn(teamClient, 'resetMemberPassword').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: { ...member, must_change_password: true }, temporary_password: 'NuevaTemp9' },
    });

    render(<TeamMemberRow member={member} />);

    openActions('Manuel Cedeño');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Restablecer contraseña' }));

    expect(await screen.findByText('NuevaTemp9')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('reactivar llama al motor y actualiza la fila', async () => {
    const reactivateSpy = vi.spyOn(teamClient, 'reactivateMember').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: { ...member, is_active: true } },
    });
    const onMemberUpdated = vi.fn();

    render(<TeamMemberRow member={{ ...member, is_active: false }} onMemberUpdated={onMemberUpdated} />);

    openActions('Manuel Cedeño');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Reactivar' }));

    await waitFor(() => {
      expect(reactivateSpy).toHaveBeenCalledWith(15);
    });
    expect(onMemberUpdated).toHaveBeenCalled();
  });

  it('muestra el 422 del último dueño tal cual llega', async () => {
    vi.spyOn(teamClient, 'deactivateMember').mockResolvedValue({
      ok: false,
      status: 422,
      error: 'El negocio debe tener al menos un dueño.',
      data: { message: 'El negocio debe tener al menos un dueño.' },
    });

    render(<TeamMemberRow member={{ ...member, role: ROLES.OWNER }} />);

    openActions('Manuel Cedeño');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Desactivar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sí, desactivar' }));

    expect(await screen.findByText('El negocio debe tener al menos un dueño.')).toBeInTheDocument();
  });
});
