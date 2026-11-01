import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WithdrawalSettingsForm from '../WithdrawalSettingsForm';
import * as withdrawalsClient from '../../../services/withdrawalsClient';

describe('WithdrawalSettingsForm (Brief 32p & 32p_fix)', () => {
  const dummySettings = {
    reminder_after_minutes: 45,
    reminder_interval_minutes: 90,
    max_reminders: 4,
    quiet_start: '01:00',
    quiet_end: '08:00',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('el motor devuelve reminder_after_minutes: 45 y el campo muestra 45 con valores reales', async () => {
    vi.spyOn(withdrawalsClient, 'getWithdrawalSettings').mockResolvedValue({
      ok: true,
      data: dummySettings,
    });
    const updateSpy = vi.spyOn(withdrawalsClient, 'updateWithdrawalSettings').mockResolvedValue({
      ok: true,
      data: { ...dummySettings, reminder_after_minutes: 50 },
    });

    render(<WithdrawalSettingsForm />);

    expect(await screen.findByDisplayValue('45')).toBeInTheDocument();
    expect(screen.getByDisplayValue('90')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
    expect(screen.getByDisplayValue('01:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('08:00')).toBeInTheDocument();

    const afterInput = screen.getByLabelText(/Primer recordatorio/i);
    fireEvent.change(afterInput, { target: { value: '50' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar ajustes/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          reminder_after_minutes: 50,
          reminder_interval_minutes: 90,
          max_reminders: 4,
          quiet_start: '01:00',
          quiet_end: '08:00',
        })
      );
      expect(screen.getByText(/Configuración de retiros guardada/i)).toBeInTheDocument();
    });
  });

  it('si la carga falla, no muestra el formulario con valores por defecto ni el botón Guardar, sino el botón Reintentar', async () => {
    const getSpy = vi.spyOn(withdrawalsClient, 'getWithdrawalSettings')
      .mockResolvedValueOnce({
        ok: false,
        error: 'Error de conexión con el motor.',
      })
      .mockResolvedValueOnce({
        ok: true,
        data: dummySettings,
      });

    render(<WithdrawalSettingsForm />);

    expect(await screen.findByText('Error de conexión con el motor.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Guardar ajustes/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Primer recordatorio/i)).not.toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Reintentar/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);

    expect(await screen.findByDisplayValue('45')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar ajustes/i })).toBeInTheDocument();
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it('muestra error si la actualización falla', async () => {
    vi.spyOn(withdrawalsClient, 'getWithdrawalSettings').mockResolvedValue({
      ok: true,
      data: dummySettings,
    });
    vi.spyOn(withdrawalsClient, 'updateWithdrawalSettings').mockResolvedValue({
      ok: false,
      error: 'Error al guardar la configuración.',
    });

    render(<WithdrawalSettingsForm />);

    await screen.findByDisplayValue('45');

    fireEvent.click(screen.getByRole('button', { name: /Guardar ajustes/i }));

    expect(await screen.findByText('Error al guardar la configuración.')).toBeInTheDocument();
  });
});
