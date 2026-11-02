import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WithdrawalForm from '../WithdrawalForm';
import * as withdrawalsClient from '../../../services/withdrawalsClient';
import * as lotsClient from '../../../services/lotsClient';

vi.mock('../../../hooks/useItemSearch', () => ({
  useItemSearch: vi.fn((term) => ({
    results: term && term.length >= 2
      ? [{ id: 10, name: 'Bife de res', unit: 'kg', requires_lot: true }]
      : [],
    searching: false,
    failed: false,
  })),
}));

async function chooseItem() {
  fireEvent.change(screen.getByPlaceholderText(/Escribe el nombre del insumo/i), { target: { value: 'Bife' } });
  fireEvent.click(await screen.findByText('Bife de res'));
  const select = await screen.findByLabelText('Elige el lote');
  await waitFor(() => expect(select.value).toBe('12'));
  return select;
}

describe('WithdrawalForm con lote (Brief 40p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(lotsClient, 'getNextLot').mockResolvedValue({
      ok: true,
      data: { data: { lot_id: 12, code: 'L0001', quantity: 10, received_on: '2026-11-01' } },
    });
    vi.spyOn(lotsClient, 'listLots').mockResolvedValue({
      ok: true,
      data: {
        data: [
          { id: 12, code: 'L0001', received_on: '2026-11-01', balances: [{ quantity: 10, location: 'warehouse' }] },
          { id: 13, code: 'L0002', received_on: '2026-11-02', balances: [{ quantity: 4, location: 'warehouse' }] },
        ],
      },
    });
  });

  it('envía el lote recomendado en el retiro', async () => {
    const spy = vi.spyOn(withdrawalsClient, 'createWithdrawal').mockResolvedValue({ ok: true, data: { id: 1 } });
    render(<WithdrawalForm user={{ id: 5, area: 'kitchen' }} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    await chooseItem();
    fireEvent.change(screen.getByPlaceholderText('0.000'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/Motivo del retiro/), { target: { value: 'Servicio' } });
    fireEvent.click(screen.getByRole('button', { name: /Declarar retiro/i }));

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy.mock.calls[0][0].items[0]).toMatchObject({ item_id: 10, lot_id: 12 });
    expect(spy.mock.calls[0][0].items[0].justification).toBeUndefined();
  });

  it('exige motivo al elegir otro lote y lo envía', async () => {
    const spy = vi.spyOn(withdrawalsClient, 'createWithdrawal').mockResolvedValue({ ok: true, data: { id: 2 } });
    render(<WithdrawalForm user={{ id: 5, area: 'kitchen' }} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    const select = await chooseItem();
    fireEvent.change(select, { target: { value: '13' } });
    fireEvent.change(screen.getByPlaceholderText('0.000'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/Motivo del retiro/), { target: { value: 'Servicio' } });
    fireEvent.click(screen.getByRole('button', { name: /Declarar retiro/i }));

    expect(await screen.findByText(/Indica el motivo para usar otro lote/)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Motivo \(5 a 300 caracteres\)/), { target: { value: 'Reservado para el evento' } });
    fireEvent.click(screen.getByRole('button', { name: /Declarar retiro/i }));

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy.mock.calls[0][0].items[0]).toMatchObject({ lot_id: 13, justification: 'Reservado para el evento' });
  });
});
