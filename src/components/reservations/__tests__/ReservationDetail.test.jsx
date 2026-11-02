import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';import ReservationDetail from '../ReservationDetail';
import * as reservationsClient from '../../../services/reservationsClient';
import { addDays } from '../reservationUi';
import { todayGuayaquil } from '../../../services/reservationsClient';

const today = todayGuayaquil();

function makeReservation(overrides = {}) {
  return {
    id: 12,
    reserved_for: `${today}T20:30:00-05:00`,
    party_size: 6,
    customer_name: 'Ana Cliente',
    customer_contact: '0991234567',
    area_note: 'Mesa 4',
    notes: 'Cumpleaños',
    status: 'confirmada',
    status_label: 'Confirmada',
    items: [{ id: 1, runfood_article_id: 3, name: 'Bife', quantity: 15 }],
    ...overrides,
  };
}

describe('ReservationDetail (Brief 39p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(reservationsClient, 'getReservationAvailability').mockResolvedValue({
      ok: true,
      data: {
        data: [{ item_id: 7, name: 'Bife', unit: 'kg', stock: '20.000', committed: '15.000', available: '5.000', min: '8.000', pending_purchase: '0.000', suggested: '3.000' }],
        horizon_days: 7,
      },
    });
  });

  it('muestra la tabla de insumos comprometidos cuando hay platos', async () => {
    render(<ReservationDetail reservation={makeReservation()} canManage today={today} onBack={vi.fn()} />);

    expect((await screen.findAllByText('Bife')).length).toBeGreaterThanOrEqual(1);
    await waitFor(() => expect(screen.getAllByText('Bife').length).toBeGreaterThanOrEqual(2));
    expect(screen.getByText('Insumos comprometidos')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(reservationsClient.getReservationAvailability).toHaveBeenCalled();
  });

  it('solo ofrece "Cumplida" y "No vino" desde el día de la reserva', async () => {
    const { unmount } = render(<ReservationDetail reservation={makeReservation({ reserved_for: `${addDays(today, 2)}T20:30:00-05:00` })} canManage today={today} onBack={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Cumplida' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'No vino' })).not.toBeInTheDocument();
    unmount();

    render(<ReservationDetail reservation={makeReservation()} canManage today={today} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Cumplida' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No vino' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('Bife').length).toBeGreaterThanOrEqual(2));
  });

  it('exige motivo para cancelar y avisa al guardar', async () => {
    const updated = makeReservation({ status: 'cancelada', status_label: 'Cancelada' });
    vi.spyOn(reservationsClient, 'cancelReservation').mockResolvedValue({ ok: true, data: { data: updated } });
    const onUpdated = vi.fn();
    render(<ReservationDetail reservation={makeReservation()} canManage today={today} onBack={vi.fn()} onUpdated={onUpdated} />);

    fireEvent.click(screen.getByRole('button', { name: /^Cancelar$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar reserva' }));

    expect(await screen.findByText('Indica el motivo de la cancelación.')).toBeInTheDocument();
    expect(reservationsClient.cancelReservation).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Motivo de la cancelación'), { target: { value: 'El cliente avisó' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar reserva' }));

    await waitFor(() => expect(reservationsClient.cancelReservation).toHaveBeenCalledWith(12, 'El cliente avisó'));
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updated));
    await waitFor(() => expect(screen.getAllByText('Bife').length).toBeGreaterThanOrEqual(2));
  });

  it('no muestra el contacto sin reservations.manage', () => {
    render(<ReservationDetail reservation={makeReservation()} canManage={false} today={today} onBack={vi.fn()} />);
    expect(screen.queryByText(/0991234567/)).not.toBeInTheDocument();
    return waitFor(() => expect(screen.getAllByText('Bife').length).toBeGreaterThanOrEqual(2));
  });
});
