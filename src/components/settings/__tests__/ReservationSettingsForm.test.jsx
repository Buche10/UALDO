import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReservationSettingsForm from '../ReservationSettingsForm';
import * as reservationsClient from '../../../services/reservationsClient';

describe('ReservationSettingsForm (Brief 39p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(reservationsClient, 'getReservationSettings').mockResolvedValue({
      ok: true,
      data: { data: { day_before_time: '16:00', same_day_time: '11:00', commitment_horizon_days: 7 } },
    });
  });

  it('carga las horas de aviso y guarda los cambios', async () => {
    const update = vi.spyOn(reservationsClient, 'updateReservationSettings').mockResolvedValue({
      ok: true,
      data: { data: { day_before_time: '17:30', same_day_time: '10:15' } },
    });

    render(<ReservationSettingsForm />);

    const before = await screen.findByLabelText('Día anterior');
    expect(before).toHaveValue('16:00');
    expect(screen.getByLabelText('Mismo día')).toHaveValue('11:00');

    fireEvent.change(before, { target: { value: '17:30' } });
    fireEvent.change(screen.getByLabelText('Mismo día'), { target: { value: '10:15' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar avisos/i }));

    await waitFor(() => expect(update).toHaveBeenCalledWith({ day_before_time: '17:30', same_day_time: '10:15' }));
    expect(await screen.findByText('Avisos de reservas guardados.')).toBeInTheDocument();
  });
});
