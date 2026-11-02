import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CashCloseSettingsForm from '../CashCloseSettingsForm';
import * as cashCloseClient from '../../../services/cashCloseClient';

describe('CashCloseSettingsForm component (Brief 35p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('carga los ajustes iniciales y permite modificarlos', async () => {
    vi.spyOn(cashCloseClient, 'getCashCloseSettings').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        head_declaration: true,
        reminder_time: '23:00',
        escalation_time: '11:00',
      },
    });

    const updateSpy = vi.spyOn(cashCloseClient, 'updateCashCloseSettings').mockResolvedValue({
      ok: true,
      status: 200,
      data: { message: 'Ajustes actualizados' },
    });

    render(<CashCloseSettingsForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Lo declara el jefe de salón/i)).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText(/Lo declara el jefe de salón/i);
    expect(checkbox).toBeChecked();

    const reminderInput = screen.getByLabelText(/Hora del recordatorio/i);
    expect(reminderInput.value).toBe('23:00');

    const escalationInput = screen.getByLabelText(/Hora límite y escalamiento/i);
    expect(escalationInput.value).toBe('11:00');

    // Cambiar valores
    fireEvent.change(reminderInput, { target: { value: '22:30' } });
    fireEvent.change(escalationInput, { target: { value: '10:30' } });
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: /Guardar ajustes/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith({
        head_declaration: false,
        reminder_time: '22:30',
        escalation_time: '10:30',
      });
      expect(screen.getByText('Ajustes guardados correctamente.')).toBeInTheDocument();
    });
  });

  it('valida formato de hora antes de enviar al motor', async () => {
    vi.spyOn(cashCloseClient, 'getCashCloseSettings').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        head_declaration: true,
        reminder_time: '23:00',
        escalation_time: '11:00',
      },
    });

    const updateSpy = vi.spyOn(cashCloseClient, 'updateCashCloseSettings');

    render(<CashCloseSettingsForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Hora del recordatorio/i)).toBeInTheDocument();
    });

    const reminderInput = screen.getByLabelText(/Hora del recordatorio/i);
    fireEvent.change(reminderInput, { target: { value: '23:55' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar ajustes/i }));

    expect(screen.getByText(/La hora del recordatorio debe tener formato HH:MM y ser como máximo 23:45/i)).toBeInTheDocument();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('muestra error cuando updateCashCloseSettings falla', async () => {
    vi.spyOn(cashCloseClient, 'getCashCloseSettings').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        head_declaration: true,
        reminder_time: '23:00',
        escalation_time: '11:00',
      },
    });

    vi.spyOn(cashCloseClient, 'updateCashCloseSettings').mockResolvedValue({
      ok: false,
      status: 422,
      error: 'Error de validación del motor.',
    });

    render(<CashCloseSettingsForm />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Guardar ajustes/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Guardar ajustes/i }));

    await waitFor(() => {
      expect(screen.getByText('Error de validación del motor.')).toBeInTheDocument();
    });
  });
});
