import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReservationForm from '../ReservationForm';
import * as reservationsClient from '../../../services/reservationsClient';
import * as runfoodCatalogClient from '../../../services/runfoodCatalogClient';
import { addDays } from '../reservationUi';
import { todayGuayaquil } from '../../../services/reservationsClient';

const today = todayGuayaquil();

function fillBase() {
  fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: addDays(today, 2) } });
  fireEvent.change(screen.getByLabelText('Nombre del cliente'), { target: { value: 'Ana Cliente' } });
}

describe('ReservationForm (Brief 39p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(reservationsClient, 'createReservation').mockResolvedValue({
      ok: true,
      data: { data: { id: 1, items: [] }, warnings: [], suggestions: [] },
    });
  });

  it('guarda una reserva sin platos y con contacto solo si puede gestionarlo', async () => {
    const onSaved = vi.fn();
    const { unmount } = render(<ReservationForm canManageContact onCancel={vi.fn()} onSaved={onSaved} />);
    fillBase();
    fireEvent.change(screen.getByLabelText('Contacto (opcional)'), { target: { value: '0991234567' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar reserva/i }));

    await waitFor(() => expect(reservationsClient.createReservation).toHaveBeenCalled());
    expect(reservationsClient.createReservation).toHaveBeenCalledWith(expect.objectContaining({
      party_size: '2',
      customer_name: 'Ana Cliente',
      customer_contact: '0991234567',
      items: [],
    }));
    expect(onSaved).toHaveBeenCalled();
    unmount();

    render(<ReservationForm canManageContact={false} onCancel={vi.fn()} onSaved={vi.fn()} />);
    expect(screen.queryByLabelText('Contacto (opcional)')).not.toBeInTheDocument();
  });

  it('agrega platos desde el buscador de RunFood con su cantidad', async () => {
    vi.spyOn(runfoodCatalogClient, 'listRunfoodRecipes').mockResolvedValue({
      ok: true,
      data: { data: [{ articulo_final: { runfood_id: 1234, descripcion: 'Bife a la plancha' } }] },
    });
    render(<ReservationForm canManageContact onCancel={vi.fn()} onSaved={vi.fn()} />);
    fillBase();

    fireEvent.change(screen.getByLabelText('Buscar plato en RunFood'), { target: { value: 'bife' } });
    const dish = await screen.findByRole('button', { name: /Bife a la plancha/i }, { timeout: 1500 });
    fireEvent.click(dish);
    fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar reserva/i }));

    await waitFor(() => expect(reservationsClient.createReservation).toHaveBeenCalledWith(expect.objectContaining({
      items: [{ runfood_article_id: 1234, quantity: '15' }],
    })));
  });

  it('muestra el texto de ayuda de platos opcionales', () => {
    render(<ReservationForm canManageContact onCancel={vi.fn()} onSaved={vi.fn()} />);
    expect(screen.getByText('Si el cliente aún no eligió, deja la reserva sin platos.')).toBeInTheDocument();
  });
});
