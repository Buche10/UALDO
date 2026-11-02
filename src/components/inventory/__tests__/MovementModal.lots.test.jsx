import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MovementModal from '../MovementModal';
import * as inventoryClient from '../../../services/inventoryClient';
import * as lotsClient from '../../../services/lotsClient';

const item = { id: 42, name: 'Bife de res', unit: 'kg', current_stock: '10.000', requires_lot: true };

describe('MovementModal con merma y lote (Brief 40p)', () => {
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
          { id: 12, code: 'L0001', received_on: '2026-11-01', balances: [{ quantity: 10, location: 'kitchen' }] },
          { id: 13, code: 'L0002', received_on: '2026-11-02', balances: [{ quantity: 4, location: 'kitchen' }] },
        ],
      },
    });
  });

  it('envía el lote y la justificación en la merma manual', async () => {
    const spy = vi.spyOn(inventoryClient, 'registerMovement').mockResolvedValue({ ok: true, status: 201, data: { message: 'ok' } });
    render(<MovementModal isOpen item={item} onClose={vi.fn()} onMovementRegistered={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Merma' }));
    const select = await screen.findByLabelText('Elige el lote');
    await waitFor(() => expect(select.value).toBe('12'));
    fireEvent.change(select, { target: { value: '13' } });
    fireEvent.change(screen.getByLabelText(/Cantidad/), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Motivo \(5 a 300 caracteres\)/), { target: { value: 'Corte dañado' } });
    fireEvent.click(screen.getByRole('button', { name: /^Registrar$/i }));

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy.mock.calls[0][1]).toMatchObject({ kind: 'merma', lot_id: 13, justification: 'Corte dañado' });
  });
});
