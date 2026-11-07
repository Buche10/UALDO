import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OvertimeForm from '../OvertimeForm';
import { ABILITIES } from '../../../services/permissions';
import * as overtimeClient from '../../../services/overtimeClient';

describe('OvertimeForm (Brief 36p / 37p_fix)', () => {
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

  const mockWorkers = [
    { id: 101, name: 'Marcos Cocinero' },
    { id: 102, name: 'Lucía Sous Chef' },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('el selector arranca vacío ("Elige a la persona") y Registrar queda deshabilitado hasta elegir', async () => {
    vi.spyOn(overtimeClient, 'listOvertimeWorkers').mockResolvedValue({
      ok: true,
      data: mockWorkers,
    });

    render(<OvertimeForm user={kitchenHead} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /trabajador/i })).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox', { name: /trabajador/i });
    expect(select.value).toBe('');
    expect(screen.getByText('Elige a la persona')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /registrar horas extra/i });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(select, { target: { value: '101' } });
    expect(submitBtn).not.toBeDisabled();
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
        }),
        expect.any(String)
      );

      expect(screen.getByRole('status')).toHaveTextContent('Quedó pendiente de aprobación del dueño.');

    });
  });

  it('usa un client_uuid estable en reintentos y lo renueva al cambiar trabajador o fecha', async () => {
    vi.spyOn(overtimeClient, 'listOvertimeWorkers').mockResolvedValue({
      ok: true,
      data: mockWorkers,
    });

    const createSpy = vi.spyOn(overtimeClient, 'createOvertime').mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Error de red',
    });

    render(<OvertimeForm user={kitchenHead} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /trabajador/i })).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox', { name: /trabajador/i });
    fireEvent.change(select, { target: { value: '101' } });

    const submitBtn = screen.getByRole('button', { name: /registrar horas extra/i });
    fireEvent.click(submitBtn);

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    const firstUuid = createSpy.mock.calls[0][1];
    expect(firstUuid).toBeTruthy();

    // Reintento sin cambiar trabajador ni fecha
    fireEvent.click(submitBtn);
    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(2));
    const secondUuid = createSpy.mock.calls[1][1];
    expect(secondUuid).toBe(firstUuid);

    // Cambiar de trabajador renueva el client_uuid
    fireEvent.change(select, { target: { value: '102' } });
    fireEvent.click(submitBtn);
    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(3));
    const thirdUuid = createSpy.mock.calls[2][1];
    expect(thirdUuid).not.toBe(firstUuid);
  });

  it('al pulsar "Anular y registrar de nuevo" pide el motivo en VoidOvertimeModal y anula', async () => {
    vi.spyOn(overtimeClient, 'listOvertimeWorkers').mockResolvedValue({
      ok: true,
      data: mockWorkers,
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

    fireEvent.change(screen.getByRole('combobox', { name: /trabajador/i }), { target: { value: '101' } });
    fireEvent.click(screen.getByRole('button', { name: /registrar horas extra/i }));

    const retryBtn = await screen.findByRole('button', { name: /anular y registrar de nuevo/i });
    fireEvent.click(retryBtn);

    // Debe abrir el modal de anulación pidiendo el motivo
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const reasonTextarea = screen.getByLabelText(/Motivo de la anulación/i);
    fireEvent.change(reasonTextarea, { target: { value: 'Se registraron horas duplicadas por equivocación' } });

    fireEvent.click(screen.getByRole('button', { name: /confirmar anulación/i }));

    await waitFor(() => {
      expect(voidSpy).toHaveBeenCalledWith(99, 'Se registraron horas duplicadas por equivocación');
      expect(createSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('status')).toHaveTextContent(/anulado y nuevas horas guardadas/i);
    });
  });

  it('si la anulación funciona y la nueva creación falla, muestra aviso claro sin perder los datos', async () => {
    vi.spyOn(overtimeClient, 'listOvertimeWorkers').mockResolvedValue({
      ok: true,
      data: mockWorkers,
    });

    vi.spyOn(overtimeClient, 'createOvertime')
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        data: {
          data: { id: 99, hours: 2, registered_by: { name: 'Jefe Saliente' } },
        },
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        error: 'Error del servidor al registrar',
      });

    vi.spyOn(overtimeClient, 'voidOvertime').mockResolvedValue({
      ok: true,
      data: { id: 99, voided: true },
    });

    render(<OvertimeForm user={kitchenHead} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /trabajador/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox', { name: /trabajador/i }), { target: { value: '101' } });
    fireEvent.click(screen.getByRole('button', { name: /registrar horas extra/i }));

    const retryBtn = await screen.findByRole('button', { name: /anular y registrar de nuevo/i });
    fireEvent.click(retryBtn);

    const reasonTextarea = screen.getByLabelText(/Motivo de la anulación/i);
    fireEvent.change(reasonTextarea, { target: { value: 'Corrección manual solicitada' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar anulación/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Se anuló el registro anterior, pero no se pudo guardar el nuevo. Vuelve a registrar las horas.')
      ).toBeInTheDocument();
    });

    // Mantiene el trabajador seleccionado y el botón habilitado para volver a registrar
    expect(screen.getByRole('combobox', { name: /trabajador/i })).toHaveValue('101');
    expect(screen.getByRole('button', { name: /registrar horas extra/i })).not.toBeDisabled();
  });
});
