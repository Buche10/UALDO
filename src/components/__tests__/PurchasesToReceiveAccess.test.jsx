import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InventoryView from '../InventoryView';
import * as auth from '../../services/auth';
import * as inventoryClient from '../../services/inventoryClient';
import * as purchasesClient from '../../services/purchasesClient';
import { ABILITIES } from '../../services/permissions';

const inventoryPage = {
  ok: true,
  data: {
    items: [{ id: 1, name: 'Bife', stock: '20.000', unit: 'kg', is_low_stock: false }],
    totals: { count: 1, low_stock_count: 0 },
    meta: { current_page: 1, last_page: 1 },
  },
};

describe('Acceso "Compras por recibir" en Inventario (Brief 39p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue(inventoryPage);
    vi.spyOn(purchasesClient, 'listPurchasesToReceive').mockResolvedValue({ ok: true, data: { data: [], meta: { current_page: 1, last_page: 1 } } });
  });

  it('un jefe de cocina con purchases.receive ve y abre la recepción', async () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({
      role: 'kitchen_head',
      capabilities: { abilities: [ABILITIES.INVENTORY_VIEW, ABILITIES.PURCHASES_RECEIVE] },
    });

    render(<InventoryView />);
    await waitFor(() => expect(screen.getByText('Inventario del Motor')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /^Compras$/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Compras por recibir/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Compras por recibir/i })).toBeInTheDocument());
    expect(purchasesClient.listPurchasesToReceive).toHaveBeenCalled();
  });

  it('un cocinero sin purchases.receive no ve el acceso', async () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({
      role: 'kitchen_staff',
      capabilities: { abilities: [ABILITIES.INVENTORY_VIEW] },
    });

    render(<InventoryView />);
    await waitFor(() => expect(screen.getByText('Inventario del Motor')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Compras por recibir/i })).not.toBeInTheDocument();
  });
});
