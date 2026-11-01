import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DailyCloseSettingsForm from '../DailyCloseSettingsForm';
import * as countsClient from '../../../../services/inventoryCountsClient';

describe('DailyCloseSettingsForm component (Brief 31p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('carga los ajustes existentes y permite actualizarlos', async () => {
    vi.spyOn(countsClient, 'getDailyCloseSettings').mockResolvedValue({
      ok: true,
      data: {
        reminder_time: '22:30',
        escalation_time: '12:00',
        locations: ['kitchen', 'lounge'],
      },
    });

    const updateSpy = vi.spyOn(countsClient, 'updateDailyCloseSettings').mockResolvedValue({
      ok: true,
      data: { status: 'updated' },
    });

    render(<DailyCloseSettingsForm />);

    expect(await screen.findByDisplayValue('22:30')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12:00')).toBeInTheDocument();

    const reminderInput = screen.getByDisplayValue('22:30');
    fireEvent.change(reminderInput, { target: { value: '23:00' } });

    const submitBtn = screen.getByRole('button', { name: /Guardar ajustes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith({
        reminder_time: '23:00',
        escalation_time: '12:00',
        locations: ['kitchen', 'lounge'],
      });
      expect(screen.getByText('Ajustes de cierre diario guardados.')).toBeInTheDocument();
    });
  });

  it('valida que al menos un área esté seleccionada', async () => {
    vi.spyOn(countsClient, 'getDailyCloseSettings').mockResolvedValue({
      ok: true,
      data: {
        reminder_time: '22:30',
        escalation_time: '12:00',
        locations: ['kitchen'],
      },
    });

    render(<DailyCloseSettingsForm />);

    expect(await screen.findByDisplayValue('22:30')).toBeInTheDocument();

    // Deseleccionamos Cocina
    const kitchenCheckbox = screen.getByRole('checkbox', { name: 'Cocina' });
    fireEvent.click(kitchenCheckbox);

    const submitBtn = screen.getByRole('button', { name: /Guardar ajustes/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText('Debes incluir al menos un área para el cierre diario.')
    ).toBeInTheDocument();
  });
});
