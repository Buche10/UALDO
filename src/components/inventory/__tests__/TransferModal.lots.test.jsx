import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TransferModal from '../TransferModal';
import * as inventoryClient from '../../../services/inventoryClient';
import * as lotsClient from '../../../services/lotsClient';

const item = {
  id: 42,
  name: 'Bife de res',
  unit: 'kg',
  requires_lot: true,
  stock_by_location: { warehouse: 10, kitchen: 0, lounge: 0 },
};

describe('TransferModal con lote (Brief 40p)', () => {
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

  it('envía el lote recomendado sin justificación', async () => {
    const spy = vi.spyOn(inventoryClient, 'transferStock').mockResolvedValue({ ok: true, status: 201, data: { item } });
    render(<TransferModal isOpen item={item} onClose={vi.fn()} onTransferSuccess={vi.fn()} />);

    const select = await screen.findByLabelText('Elige el lote');
    await waitFor(() => expect(select.value).toBe('12'));
    fireEvent.change(screen.getByPlaceholderText('Ej: 2.500'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /Transferir/i }));

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy.mock.calls[0][0]).toMatchObject({ itemId: 42, lot_id: 12 });
    expect(spy.mock.calls[0][0].justification).toBeUndefined();
  });

  it('no deja continuar con otro lote sin motivo y envía la justificación', async () => {
    const spy = vi.spyOn(inventoryClient, 'transferStock').mockResolvedValue({ ok: true, status: 201, data: { item } });
    render(<TransferModal isOpen item={item} onClose={vi.fn()} onTransferSuccess={vi.fn()} />);

    const select = await screen.findByLabelText('Elige el lote');
    await waitFor(() => expect(select.value).toBe('12'));
    fireEvent.change(select, { target: { value: '13' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 2.500'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /Transferir/i }));

    expect(await screen.findByText(/Indica el motivo para usar otro lote/)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Motivo \(5 a 300 caracteres\)/), { target: { value: 'Reservado para el evento' } });
    fireEvent.click(screen.getByRole('button', { name: /Transferir/i }));

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy.mock.calls[0][0]).toMatchObject({
      lot_id: 13,
      justification: 'Reservado para el evento',
    });
  });
});
