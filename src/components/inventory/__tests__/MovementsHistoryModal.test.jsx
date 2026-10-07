import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MovementsHistoryModal from '../MovementsHistoryModal';
import * as inventoryClient from '../../../services/inventoryClient';

describe('MovementsHistoryModal component', () => {
  const item = {
    id: 15,
    name: 'Pechuga de Pollo',
    unit: 'kg',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders empty state when there are no movements', async () => {
    vi.spyOn(inventoryClient, 'fetchMovements').mockResolvedValue({
      ok: true,
      data: {
        data: [],
        meta: { current_page: 1, last_page: 1 },
      },
    });

    render(<MovementsHistoryModal isOpen={true} item={item} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('No hay movimientos registrados para este insumo.')).toBeInTheDocument();
    });
  });

  it('renders movements list with formatted quantities and reasons', async () => {
    const mockList = [
      {
        id: 101,
        kind: 'entrada',
        quantity: '5.500',
        reason: 'Compra proveedor',
        balance_after: '15.500',
        created_at: '2026-10-07T10:00:00Z',
      },
      {
        id: 102,
        kind: 'salida',
        quantity: '-2.250',
        reason: '',
        balance_after: '13.250',
        created_at: '2026-10-07T11:00:00Z',
      },
    ];

    vi.spyOn(inventoryClient, 'fetchMovements').mockResolvedValue({
      ok: true,
      data: {
        data: mockList,
        meta: { current_page: 1, last_page: 1 },
      },
    });

    render(<MovementsHistoryModal isOpen={true} item={item} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Compra proveedor')).toBeInTheDocument();
      expect(screen.getByText('Salida de inventario')).toBeInTheDocument();
      expect(screen.getByText('+5.500')).toBeInTheDocument();
      expect(screen.getByText('-2.250')).toBeInTheDocument();
      expect(screen.getByText('Saldo: 15.500')).toBeInTheDocument();
      expect(screen.getByText('Saldo: 13.250')).toBeInTheDocument();
    });
  });

  it('loads more movements appending page 2 without duplicating or replacing previous items', async () => {
    const page1 = [
      {
        id: 201,
        kind: 'entrada',
        quantity: '10.000',
        reason: 'Lote inicial',
        balance_after: '10.000',
        created_at: '2026-10-07T08:00:00Z',
      },
    ];
    const page2 = [
      {
        id: 202,
        kind: 'salida',
        quantity: '-3.000',
        reason: 'Consumo cocina',
        balance_after: '7.000',
        created_at: '2026-10-07T09:00:00Z',
      },
    ];

    const fetchSpy = vi.spyOn(inventoryClient, 'fetchMovements')
      .mockResolvedValueOnce({
        ok: true,
        data: {
          data: page1,
          meta: { current_page: 1, last_page: 2 },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          data: page2,
          meta: { current_page: 2, last_page: 2 },
        },
      });

    render(<MovementsHistoryModal isOpen={true} item={item} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Lote inicial')).toBeInTheDocument();
      expect(screen.getByText('Cargar más')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cargar más'));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(15, 2);
      // Both page 1 and page 2 must be present simultaneously
      expect(screen.getByText('Lote inicial')).toBeInTheDocument();
      expect(screen.getByText('Consumo cocina')).toBeInTheDocument();
    });

    // Cargar mas button is now hidden because current_page === last_page
    expect(screen.queryByText('Cargar más')).not.toBeInTheDocument();
  });

  it('renders error message when fetch fails', async () => {
    vi.spyOn(inventoryClient, 'fetchMovements').mockResolvedValue({
      ok: false,
      error: 'Error de conexion con el motor',
    });

    render(<MovementsHistoryModal isOpen={true} item={item} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Error de conexion con el motor')).toBeInTheDocument();
    });
  });

  it('closes modal when close button is clicked', async () => {
    vi.spyOn(inventoryClient, 'fetchMovements').mockResolvedValue({
      ok: true,
      data: { data: [], meta: { current_page: 1, last_page: 1 } },
    });

    const handleClose = vi.fn();
    render(<MovementsHistoryModal isOpen={true} item={item} onClose={handleClose} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Cerrar historial')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Cerrar historial'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
