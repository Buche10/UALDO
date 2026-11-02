import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OvertimeForm from '../OvertimeForm';
import { ABILITIES } from '../../../services/permissions';
import * as overtimeClient from '../../../services/overtimeClient';

describe('OvertimeForm (Brief 36p)', () => {
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
      abilities: [ABILITIES.OVERTIME_REGISTER_KITCHEN, ABILITIES.OVERTIME_REGISTER_LOUNGE, ABILITIES.OVERTIME_REPORT],
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('un jefe de cocina ve solo su equipo y no ve el selector de área', async () => {
    const mockWorkers = [
      { id: 101, name: 'Marcos Cocinero' },
      { id: 102, name: 'Lucía Sous Chef' },
    ];
    vi.spyOn(overtimeClient, 'listOvertimeWorkers').mockResolvedValue({
      ok: true,
      data: mockWorkers,
    });

    render(<OvertimeForm user={kitchenHead} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /trabajador/i })).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/^área$/i)).toBeNull();
    expect(screen.getByText('Marcos Cocinero')).toBeInTheDocument();
    expect(screen.getByText('Lucía Sous Chef')).toBeInTheDocument();
  });

  it('administración puede seleccionar el área', async () => {
    vi.spyOn(overtimeClient, 'listOvertimeWorkers').mockResolvedValue({
      ok: true,
      data: [{ id: 201, name: 'Pedro Mesero' }],
    });

    render(<OvertimeForm user={adminUser} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/^área$/i)).toBeInTheDocument();
    });
  });

  it('permite registrar con nombre libre en modo "Otra persona"', async () => {
    vi.spyOn(overtimeClient, 'listOvertimeWorkers').mockResolvedValue({ ok: true, data: [] });
    const createSpy = vi.spyOn(overtimeClient, 'createOvertime').mockResolvedValue({
      ok: true,
      data: { id: 50 },
    });

    render(<OvertimeForm user={kitchenHead} />);

    fireEvent.click(screen.getByRole('button', { name: /otra persona/i }));
    const nameInput = screen.getByPlaceholderText(/nombre completo/i);
    fireEvent.change(nameInput, { target: { value: 'Mateo Refuerzo' } });

    fireEvent.click(screen.getByRole('button', { name: /registrar horas extra/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          worker_name: 'Mateo Refuerzo',
          area: 'kitchen',
        })
      );
    });
  });

  it('en error 409 de duplicado muestra banner con opción "Anular y registrar de nuevo"', async () => {
    vi.spyOn(overtimeClient, 'listOvertimeWorkers').mockResolvedValue({
      ok: true,
      data: [{ id: 101, name: 'Marcos Cocinero' }],
    });

    vi.spyOn(overtimeClient, 'createOvertime').mockResolvedValue({
      ok: false,
      status: 409,
      data: {
        data: {
          id: 99,
          hours: 2,
          registered_by: { name: 'Jefe Saliente' },
        },
      },
    });

    render(<OvertimeForm user={kitchenHead} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /trabajador/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /registrar horas extra/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/ya existe un registro de horas extra/i);
      expect(screen.getByRole('button', { name: /anular y registrar de nuevo/i })).toBeInTheDocument();
    });
  });

  it('al pulsar "Anular y registrar de nuevo" anula el existente y registra las nuevas horas', async () => {
    vi.spyOn(overtimeClient, 'listOvertimeWorkers').mockResolvedValue({
      ok: true,
      data: [{ id: 101, name: 'Marcos Cocinero' }],
    });

    const createSpy = vi.spyOn(overtimeClient, 'createOvertime')
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        data: {
          data: {
            id: 99,
            hours: 2,
            registered_by: { name: 'Jefe Saliente' },
          },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: { id: 100 },
      });

    const voidSpy = vi.spyOn(overtimeClient, 'voidOvertime').mockResolvedValue({
      ok: true,
      data: { id: 99, voided: true },
    });

    render(<OvertimeForm user={kitchenHead} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /trabajador/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /registrar horas extra/i }));

    const retryBtn = await screen.findByRole('button', { name: /anular y registrar de nuevo/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(voidSpy).toHaveBeenCalledWith(99, 'Corrección de horas registradas');
      expect(createSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('status')).toHaveTextContent(/anulado y nuevas horas guardadas/i);
    });
  });
});
