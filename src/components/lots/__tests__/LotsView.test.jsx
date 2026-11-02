import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LotsView from '../LotsView';
import * as lotsClient from '../../../services/lotsClient';
import * as inventoryClient from '../../../services/inventoryClient';

function isoDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

const fetchedLots = [
  {
    id: 13,
    code: 'L0002',
    status: 'activo',
    item: 'Bife de res',
    received_on: isoDaysAgo(1),
    received_weight: 5,
    balances: [{ item_id: 4, item: 'Bife de res', location: 'kitchen', location_label: 'Cocina', quantity: 5 }],
  },
  {
    id: 12,
    code: 'L0001',
    status: 'activo',
    item: 'Bife de res',
    received_on: isoDaysAgo(10),
    received_weight: 10,
    balances: [{ item_id: 4, item: 'Bife de res', location: 'warehouse', location_label: 'Bodega', quantity: 10 }],
  },
];

describe('LotsView (Brief 40p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(lotsClient, 'listLots').mockResolvedValue({
      ok: true,
      data: { data: fetchedLots, meta: { current_page: 1, last_page: 1, total: 2 } },
    });
    vi.spyOn(lotsClient, 'getLotSettings').mockResolvedValue({ ok: true, data: { data: { age_alert_days: 5 } } });
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: {
        items: [{ id: 4, name: 'Bife de res', requires_lot: true }],
        meta: { current_page: 1, last_page: 1 },
      },
    });
  });

  it('ordena del más antiguo al más nuevo y advierte pasado el plazo', async () => {
    render(<LotsView canManage onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('L0001')).toBeInTheDocument());
    const codes = screen.getAllByText(/^L000\d$/).map((node) => node.textContent);
    expect(codes).toEqual(['L0001', 'L0002']);
    expect(screen.getByText('Pasado el plazo')).toBeInTheDocument();
    expect(screen.getByText(/Bife de res · Bodega/)).toBeInTheDocument();
  });

  it('busca por código y filtra por estado y corte', async () => {
    render(<LotsView canManage onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('L0001')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Buscar lote por código'), { target: { value: 'L0002' } });
    expect(screen.queryByText('L0001')).not.toBeInTheDocument();
    expect(screen.getByText('L0002')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'no_apto' } });
    await waitFor(() => {
      expect(lotsClient.listLots).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'no_apto' }));
    });

    fireEvent.change(screen.getByLabelText('Corte'), { target: { value: '4' } });
    await waitFor(() => {
      expect(lotsClient.listLots).toHaveBeenLastCalledWith(expect.objectContaining({ itemId: '4' }));
    });
  });
});
