import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WithdrawalSettingsForm from '../WithdrawalSettingsForm';
import * as withdrawalsClient from '../../../services/withdrawalsClient';

describe('WithdrawalSettingsForm (Brief 32p)', () => {
  const dummySettings = {
    reminder_after_minutes: 60,
    reminder_interval_minutes: 90,
    max_reminders: 4,
    quiet_start: '01:00',
    quiet_end: '08:00',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('carga la configuración inicial y permite actualizarla con éxito', async () => {
    vi.spyOn(withdrawalsClient, 'getWithdrawalSettings').mockResolvedValue({
      ok: true,
      data: dummySettings,
    });
    const updateSpy = vi.spyOn(withdrawalsClient, 'updateWithdrawalSettings').mockResolvedValue({
      ok: true,
      data: { ...dummySettings, reminder_after_minutes: 45 },
    });

    render(<WithdrawalSettingsForm />);

    expect(await screen.findByDisplayValue('60')).toBeInTheDocument();
    expect(screen.getByDisplayValue('90')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();

    const afterInput = screen.getByLabelText(/Primer recordatorio/i);
    fireEvent.change(afterInput, { target: { value: '45' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar ajustes/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          reminder_after_minutes: 45,
          reminder_interval_minutes: 90,
          max_reminders: 4,
          quiet_start: '01:00',
          quiet_end: '08:00',
        })
      );
      expect(screen.getByText(/Configuración de retiros guardada/i)).toBeInTheDocument();
    });
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

    await screen.findByDisplayValue('60');

    fireEvent.click(screen.getByRole('button', { name: /Guardar ajustes/i }));

    expect(await screen.findByText('Error al guardar la configuración.')).toBeInTheDocument();
  });
});
