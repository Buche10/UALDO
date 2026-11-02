import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DobleFiloCard from '../DobleFiloCard';
import * as apiClient from '../../services/apiClient';
import * as inventoryClient from '../../services/inventoryClient';

describe('DobleFiloCard component (Brief 41p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: { totals: { count: 24, low_stock_count: 3 } },
    });
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      ok: true,
      data: { business_name: 'Doble Filo' },
    });
  });

  it('muestra el resumen del motor sin pestaña Mesas ni Parrilla de Mesas', async () => {
    render(<DobleFiloCard onNavigateToInventory={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Restaurante: Doble Filo')).toBeInTheDocument());
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('Mesas')).not.toBeInTheDocument();
    expect(screen.queryByText('Parrilla de Mesas:')).not.toBeInTheDocument();
    expect(screen.queryByText(/Mesa \d/)).not.toBeInTheDocument();
  });

  it('no inventa totales cuando el motor no responde', async () => {
    inventoryClient.listInventory.mockResolvedValue({ ok: false, status: 0, isNetworkError: true });
    apiClient.request.mockResolvedValue({ ok: false, status: 0, isNetworkError: true });

    render(<DobleFiloCard onNavigateToInventory={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('No se pudo consultar el resumen del motor.')).toBeInTheDocument());
    expect(screen.getAllByText('Sin datos')).toHaveLength(2);
  });
});
