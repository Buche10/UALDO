import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import OvertimeView from '../OvertimeView';
import { ABILITIES } from '../../../services/permissions';
import * as overtimeClient from '../../../services/overtimeClient';

describe('OvertimeView (Brief 36p y Brief 46p)', () => {
  const kitchenHead = {
    id: 10,
    role: 'kitchen_head',
    capabilities: {
      role: 'kitchen_head',
      area: 'kitchen',
      abilities: [ABILITIES.OVERTIME_REGISTER_KITCHEN],
    },
  };

  const adminUser = {
    id: 1,
    role: 'admin',
    capabilities: {
      role: 'admin',
      abilities: [
        ABILITIES.OVERTIME_REGISTER_KITCHEN,
        ABILITIES.OVERTIME_REGISTER_LOUNGE,
        ABILITIES.OVERTIME_REPORT,
      ],
    },
  };

  const ownerUser = {
    id: 99,
    role: 'owner',
    capabilities: {
      role: 'owner',
      is_owner: true,
      abilities: [
        ABILITIES.OVERTIME_REGISTER_KITCHEN,
        ABILITIES.OVERTIME_REGISTER_LOUNGE,
        ABILITIES.OVERTIME_REPORT,
        ABILITIES.OVERTIME_APPROVE,
      ],
    },
  };

  const pendingEntry = {
    id: 101,
    area: 'kitchen',
    area_label: 'Cocina',
    worker: { id: 20, name: 'Hugo Ayudante' },
    work_date: '2026-11-06',
    hours: 3,
    note: 'Cierre demorado',
    status: 'pending',
    registered_by: { id: 10, name: 'Chef Juan' },
    voided: false,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(overtimeClient, 'listOvertimeWorkers').mockResolvedValue({ ok: true, data: [] });
    vi.spyOn(overtimeClient, 'listOvertime').mockResolvedValue({ ok: true, data: { data: [], meta: {} } });
    vi.spyOn(overtimeClient, 'getOvertimeSummary').mockResolvedValue({ ok: true, data: { month: '2026-10', total_hours: 0, people: 0, workers: [] } });
    vi.spyOn(overtimeClient, 'pendingOvertimeCount').mockResolvedValue({ ok: true, data: { count: 0 } });
  });

  it('un jefe de cocina ve pestañas "Registrar" y "Registros", pero no ve "Mes" ni "Por aprobar"', async () => {
    render(<OvertimeView user={kitchenHead} />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /registrar/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('tab', { name: /registros/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /mes/i })).toBeNull();
    expect(screen.queryByRole('tab', { name: /por aprobar/i })).toBeNull();
  });

  it('administración sin overtime.approve no ve "Por aprobar"', async () => {
    render(<OvertimeView user={adminUser} />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /registrar/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('tab', { name: /registros/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /mes/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /por aprobar/i })).toBeNull();
  });

  it('con overtime.approve y pendientes, abre "Por aprobar"', async () => {
    vi.spyOn(overtimeClient, 'pendingOvertimeCount').mockResolvedValue({
      ok: true,
      data: { count: 1 },
    });
    vi.spyOn(overtimeClient, 'listOvertime').mockResolvedValue({
      ok: true,
      data: {
        data: [pendingEntry],
        meta: { current_page: 1, last_page: 1, total: 1 },
      },
    });

    render(<OvertimeView user={ownerUser} />);

    const porAprobarTab = await screen.findByRole('tab', { name: /por aprobar/i });
    await waitFor(() => {
      expect(porAprobarTab).toHaveAttribute('aria-selected', 'true');
    });
    expect(await screen.findByText('Hugo Ayudante')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /aprobar/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /rechazar/i })).toBeInTheDocument();
  });

  it('aprobar llama al cliente approveOvertime y refresca', async () => {
    vi.spyOn(overtimeClient, 'pendingOvertimeCount').mockResolvedValue({
      ok: true,
      data: { count: 1 },
    });
    vi.spyOn(overtimeClient, 'listOvertime').mockResolvedValue({
      ok: true,
      data: {
        data: [pendingEntry],
        meta: { current_page: 1, last_page: 1, total: 1 },
      },
    });
    const approveSpy = vi.spyOn(overtimeClient, 'approveOvertime').mockResolvedValue({
      ok: true,
      data: { id: 101, status: 'approved' },
    });

    render(<OvertimeView user={ownerUser} />);

    const approveBtn = await screen.findByRole('button', { name: /aprobar/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(approveSpy).toHaveBeenCalledWith(101);
    });
  });

  it('rechazar exige motivo abriendo RejectOvertimeModal y llama a rejectOvertime', async () => {
    vi.spyOn(overtimeClient, 'pendingOvertimeCount').mockResolvedValue({
      ok: true,
      data: { count: 1 },
    });
    vi.spyOn(overtimeClient, 'listOvertime').mockResolvedValue({
      ok: true,
      data: {
        data: [pendingEntry],
        meta: { current_page: 1, last_page: 1, total: 1 },
      },
    });
    const rejectSpy = vi.spyOn(overtimeClient, 'rejectOvertime').mockResolvedValue({
      ok: true,
      data: { id: 101, status: 'rejected' },
    });

    render(<OvertimeView user={ownerUser} />);

    const rejectBtn = await screen.findByRole('button', { name: /rechazar/i });
    fireEvent.click(rejectBtn);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const textarea = within(dialog).getByLabelText(/motivo del rechazo/i);
    const confirmBtn = within(dialog).getByRole('button', { name: /^rechazar$/i });

    expect(confirmBtn).toBeDisabled();

    fireEvent.change(textarea, { target: { value: 'Turno no coordinado con jefatura' } });
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(rejectSpy).toHaveBeenCalledWith(101, 'Turno no coordinado con jefatura');
    });
  });

  it('abre directamente en "Mes" si se pasa initialMonth y tiene overtime.report', async () => {
    render(<OvertimeView user={adminUser} initialMonth="2026-10" />);

    const mesTab = await screen.findByRole('tab', { name: /mes/i });
    expect(mesTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText(/mes a consultar/i)).toBeInTheDocument();
  });

  it('RESTRICCIÓN ESTRICTA: no renderiza ningún símbolo "$" ni dinero en la interfaz', async () => {
    const { container } = render(<OvertimeView user={adminUser} initialMonth="2026-10" />);

    await screen.findByRole('tab', { name: /mes/i });

    const textContent = container.textContent || '';
    expect(textContent).not.toContain('$');
    expect(textContent.toLowerCase()).not.toContain('usd');
    expect(textContent.toLowerCase()).not.toContain('sueldo');
    expect(textContent.toLowerCase()).not.toContain('salario');
    expect(textContent.toLowerCase()).not.toContain('nómina');
  });
});
