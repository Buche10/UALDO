import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReservationsView from '../ReservationsView';
import * as reservationsClient from '../../../services/reservationsClient';
import * as auth from '../../../services/auth';
import { ABILITIES } from '../../../services/permissions';
import { todayGuayaquil } from '../../../services/reservationsClient';
import { addDays } from '../reservationUi';

const today = todayGuayaquil();

function reservation(overrides = {}) {
  return {
    id: 1,
    reserved_for: `${today}T20:30:00-05:00`,
    party_size: 4,
    customer_name: 'Ana Cliente',
    customer_contact: '0991234567',
    area_note: 'Mesa 4',
    notes: null,
    status: 'confirmada',
    status_label: 'Confirmada',
    items: [],
    ...overrides,
  };
}

describe('ReservationsView (Brief 39p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('ordena por hora, marca "Con platos" y cuenta reservas del día', async () => {
    const later = reservation({ id: 2, reserved_for: `${today}T20:30:00-05:00`, customer_name: 'Luis Pérez' });
    const earlier = reservation({ id: 1, reserved_for: `${today}T12:00:00-05:00`, customer_name: 'Ana Cliente', items: [{ id: 9, runfood_article_id: 3, name: 'Bife', quantity: 2 }] });
    vi.spyOn(auth, 'getUser').mockReturnValue({ id: 1, capabilities: { abilities: [ABILITIES.RESERVATIONS_VIEW, ABILITIES.RESERVATIONS_MANAGE] } });
    vi.spyOn(reservationsClient, 'listReservations').mockResolvedValue({
      ok: true,
      data: { data: [later, earlier], meta: { current_page: 1, last_page: 1, total: 2 } },
    });

    render(<ReservationsView initialId={null} />);

    await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument());
    expect(screen.getByText('Luis')).toBeInTheDocument();
    expect(screen.getByText('Con platos')).toBeInTheDocument();
    expect(screen.getByText('2 reservas, 8 personas')).toBeInTheDocument();
    const times = screen.getAllByText(/^\d{2}:\d{2}$/).map((node) => node.textContent);
    expect(times.slice(0, 2)).toEqual(['12:00', '20:30']);
  });

  it('muestra "Nueva reserva" y el contacto solo con reservations.manage', async () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({ id: 5, capabilities: { abilities: [ABILITIES.RESERVATIONS_VIEW, ABILITIES.RESERVATIONS_MANAGE] } });
    vi.spyOn(reservationsClient, 'listReservations').mockResolvedValue({ ok: true, data: { data: [reservation()], meta: { current_page: 1, last_page: 1 } } });

    const { unmount } = render(<ReservationsView />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Nueva reserva/i })).toBeInTheDocument());
    fireEvent.click(screen.getByText('Ana'));
    expect(await screen.findByText(/Contacto: 0991234567/)).toBeInTheDocument();
    unmount();

    vi.spyOn(auth, 'getUser').mockReturnValue({ id: 6, capabilities: { abilities: [ABILITIES.RESERVATIONS_VIEW] } });
    render(<ReservationsView />);
    await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Nueva reserva/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Ana'));
    expect(await screen.findByText('Ana Cliente')).toBeInTheDocument();
    expect(screen.queryByText(/0991234567/)).not.toBeInTheDocument();
  });

  it('abre el detalle cuando llega un aviso con params.id', async () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({ id: 1, capabilities: { abilities: [ABILITIES.RESERVATIONS_VIEW] } });
    vi.spyOn(reservationsClient, 'listReservations').mockResolvedValue({ ok: true, data: { data: [], meta: { current_page: 1, last_page: 1 } } });
    const getOne = vi.spyOn(reservationsClient, 'getReservation').mockResolvedValue({ ok: true, data: { data: reservation({ id: 8 }) } });
    vi.spyOn(reservationsClient, 'getReservationAvailability').mockResolvedValue({ ok: true, data: { data: [], horizon_days: 7 } });

    render(<ReservationsView initialId={8} />);

    expect(await screen.findByText('Ana Cliente')).toBeInTheDocument();
    expect(getOne).toHaveBeenCalledWith(8);
  });

  it('muestra warnings y el aviso de bajo mínimo al guardar una reserva', async () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({ id: 1, capabilities: { abilities: [ABILITIES.RESERVATIONS_VIEW, ABILITIES.RESERVATIONS_MANAGE] } });
    vi.spyOn(reservationsClient, 'listReservations').mockResolvedValue({ ok: true, data: { data: [], meta: { current_page: 1, last_page: 1 } } });
    vi.spyOn(reservationsClient, 'createReservation').mockResolvedValue({
      ok: true,
      data: {
        data: reservation({ id: 8, items: [{ id: 1, runfood_article_id: 3, name: 'Bife', quantity: 15 }] }),
        warnings: ['Sin receta: no compromete stock (Ensalada)'],
        suggestions: [{ item_id: 7, name: 'Bife', available: '5.000', min: '8.000', suggested: '3.000' }],
      },
    });
    vi.spyOn(reservationsClient, 'getReservationAvailability').mockResolvedValue({
      ok: true,
      data: { data: [], horizon_days: 7 },
    });

    render(<ReservationsView />);
    fireEvent.click(await screen.findByRole('button', { name: /Nueva reserva/i }));
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: addDays(today, 2) } });
    fireEvent.change(screen.getByLabelText('Nombre del cliente'), { target: { value: 'Ana Cliente' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar reserva/i }));

    await waitFor(() => expect(screen.getByText('Sin receta: no compromete stock (Ensalada)')).toBeInTheDocument());
    expect(screen.getByText(/Esta reserva deja poco Bife: disponible 5, mínimo 8\. Se avisó a compras\./)).toBeInTheDocument();
  });
});
