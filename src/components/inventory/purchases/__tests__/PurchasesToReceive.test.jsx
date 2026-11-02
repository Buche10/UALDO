import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PurchasesToReceiveView from '../PurchasesToReceiveView';
import * as purchasesClient from '../../../../services/purchasesClient';

const page = {
  ok: true,
  data: {
    data: [{ id: 21, purchased_on: '2026-11-01', supplier: { id: 3, name: 'Distribuidora Andina' }, lines_count: 2, invoice_number: 'F-100', total: '120.00' }],
    meta: { current_page: 1, last_page: 1, total: 1 },
  },
};

const purchase = {
  id: 21,
  status: 'draft',
  purchased_on: '2026-11-01',
  supplier: { id: 3, name: 'Distribuidora Andina' },
  location_label: 'Bodega',
  invoice_number: 'F-100',
  total: '120.00',
  lines: [
    { id: 1, item_name: 'Bife', unit: 'kg', quantity: 10, unit_cost: 8, line_total: '80.00' },
    { id: 2, item_name: 'Servilletas', unit: 'paquete', quantity: 4, unit_cost: null, line_total: '40.00', is_other: true },
  ],
};

describe('PurchasesToReceiveView (Brief 39p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(purchasesClient, 'listPurchasesToReceive').mockResolvedValue(page);
    vi.spyOn(purchasesClient, 'getPurchase').mockResolvedValue({ ok: true, data: { data: purchase } });
  });

  it('lista las compras por recibir y abre el detalle con el botón Recibir', async () => {
    render(<PurchasesToReceiveView canSeeCosts={false} onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Distribuidora Andina')).toBeInTheDocument());
    expect(screen.getByText(/2 líneas/)).toBeInTheDocument();
    expect(screen.queryByText(/USD/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Distribuidora Andina/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Recibir' })).toBeInTheDocument());
    expect(screen.getByText('Bife')).toBeInTheDocument();
    expect(screen.queryByText(/Total:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/USD/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Recibir' }));
    expect(screen.getByRole('heading', { name: 'Recepción contra factura' })).toBeInTheDocument();
  });

  it('muestra montos solo con inventory.costs', async () => {
    render(<PurchasesToReceiveView canSeeCosts onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Distribuidora Andina')).toBeInTheDocument());
    expect(screen.getByText(/USD 120/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Distribuidora Andina/i }));
    await waitFor(() => expect(screen.getByText(/Total: USD 120/)).toBeInTheDocument());
  });
});
