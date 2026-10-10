import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import InventoryView from '../InventoryView';
import * as inventoryClient from '../../services/inventoryClient';
import * as auth from '../../services/auth';
import * as productionClient from '../../services/productionClient';

describe('InventoryView component permissions and actions', () => {
  const dummyItems = [
    {
      id: 1,
      name: 'Pechuga de Pollo',
      stock: '10.500',
      unit: 'kg',
      is_low_stock: false,
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders "Nuevo Insumo" button when user is owner (capabilities.is_owner === true)', async () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({
      role: 'staff',
      capabilities: { is_owner: true },
    });
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: {
        items: dummyItems,
        totals: { count: 1, low_stock_count: 0 },
        meta: { current_page: 1, last_page: 1 },
      },
    });

    render(<InventoryView />);

    await waitFor(() => {
      expect(screen.getByText('Inventario del Motor')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Nuevo Insumo/i })).toBeInTheDocument();
  });

  it('does NOT render "Nuevo Insumo" button when user is regular staff without owner capability', async () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({
      role: 'staff',
      capabilities: { is_owner: false },
    });
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: {
        items: dummyItems,
        totals: { count: 1, low_stock_count: 0 },
        meta: { current_page: 1, last_page: 1 },
      },
    });

    render(<InventoryView />);

    await waitFor(() => {
      expect(screen.getByText('Inventario del Motor')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Nuevo Insumo/i })).not.toBeInTheDocument();
  });

  it('staff sees "Producción" and opens the production view, without owner actions', async () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({ role: 'staff', capabilities: { is_owner: false } });
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: { items: dummyItems, totals: { count: 1, low_stock_count: 0 }, meta: { current_page: 1, last_page: 1 } },
    });
    const listRuns = vi.spyOn(productionClient, 'listRuns').mockResolvedValue({ ok: true, data: { data: [], meta: { current_page: 1, last_page: 1 } } });

    render(<InventoryView />);
    await waitFor(() => expect(screen.getByText('Inventario del Motor')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Conteos/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Producción/i }));
    await waitFor(() => expect(screen.getByText('Producción y porcionado')).toBeInTheDocument());
    expect(listRuns).toHaveBeenCalled();
  });

  it('renders "Mostrar inactivos" switch and toggles filter', async () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({ role: 'staff' });
    const listSpy = vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: {
        items: dummyItems,
        totals: { count: 1, low_stock_count: 0 },
        meta: { current_page: 1, last_page: 1 },
      },
    });

    render(<InventoryView />);

    await waitFor(() => {
      expect(screen.getByText('Inventario del Motor')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('switch', { name: /Mostrar inactivos/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).not.toBeChecked();

    fireEvent.click(toggle);
    expect(toggle).toBeChecked();

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ includeInactive: true })
      );
    });
  });

  it('renders "Conteos" button for owner and switches to CountsView, while non-owner does not see it', async () => {
    // Non-owner test
    vi.spyOn(auth, 'getUser').mockReturnValue({
      role: 'staff',
      capabilities: { is_owner: false },
    });
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: {
        items: dummyItems,
        totals: { count: 1, low_stock_count: 0 },
        meta: { current_page: 1, last_page: 1 },
      },
    });

    const { unmount } = render(<InventoryView />);
    await waitFor(() => {
      expect(screen.getByText('Inventario del Motor')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /Conteos/i })).not.toBeInTheDocument();
    unmount();

    // Owner test
    vi.spyOn(auth, 'getUser').mockReturnValue({
      role: 'owner',
      capabilities: { is_owner: true },
    });

    render(<InventoryView />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Conteos/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Conteos/i }));

    await waitFor(() => {
      expect(screen.getByText('Conteos Físicos por Ubicación')).toBeInTheDocument();
    });
  });

  it('does NOT call listCounts or request /inventory/counts when user does not have owner capability', async () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({
      role: 'staff',
      capabilities: { is_owner: false },
    });
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: {
        items: dummyItems,
        totals: { count: 1, low_stock_count: 0 },
        meta: { current_page: 1, last_page: 1 },
      },
    });

    const countsClient = await import('../../services/inventoryCountsClient');
    const countsSpy = vi.spyOn(countsClient, 'listCounts');
    const apiClient = await import('../../services/apiClient');
    const reqSpy = vi.spyOn(apiClient, 'request');

    render(<InventoryView />);

    await waitFor(() => {
      expect(screen.getByText('Inventario del Motor')).toBeInTheDocument();
    });

    // Vaciar efectos
    await new Promise((r) => setTimeout(r, 50));

    expect(countsSpy).not.toHaveBeenCalled();
    const countRequests = reqSpy.mock.calls.filter(([url]) => typeof url === 'string' && url.includes('/inventory/counts'));
    expect(countRequests.length).toBe(0);
  });
});

