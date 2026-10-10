import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CountsView from '../CountsView';
import * as inventoryCountsClient from '../../../../services/inventoryCountsClient';
import * as inventoryClient from '../../../../services/inventoryClient';

describe('CountsView component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders header, description, and calls onBack when clicking back button', async () => {
    vi.spyOn(inventoryCountsClient, 'listCounts').mockResolvedValue({
      ok: true,
      data: { data: [], meta: { current_page: 1, last_page: 1 } },
    });

    const onBack = vi.fn();
    render(<CountsView isOwner={true} onBack={onBack} />);

    expect(screen.getByText('Conteos Físicos por Ubicación')).toBeInTheDocument();
    expect(screen.getByText('Volver al inventario')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Volver al inventario'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders list of counts with badges and allows selecting a count', async () => {
    const mockCounts = [
      {
        id: 7,
        location: 'kitchen',
        location_label: 'Cocina',
        status: 'draft',
        notes: 'Reapertura semana 1',
        created_at: '2026-10-08T10:00:00Z',
      },
    ];

    vi.spyOn(inventoryCountsClient, 'listCounts').mockResolvedValue({
      ok: true,
      data: { data: mockCounts, meta: { current_page: 1, last_page: 1 } },
    });

    // Mock for CountSheet when active
    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: mockCounts[0] },
    });
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: { items: [], meta: { last_page: 1 } },
    });

    render(<CountsView isOwner={true} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Reapertura semana 1')).toBeInTheDocument();
      expect(screen.getAllByText('Borrador').length).toBeGreaterThanOrEqual(1);
    });

    // Click on count card to open CountSheet
    fireEvent.click(screen.getByText('Abrir conteo'));

    await waitFor(() => {
      expect(screen.getByText(/Planilla de Conteo/)).toBeInTheDocument();
    });
  });

  it('opens and closes NewCountModal when clicking Nuevo Conteo', async () => {
    vi.spyOn(inventoryCountsClient, 'listCounts').mockResolvedValue({
      ok: true,
      data: { data: [], meta: { current_page: 1, last_page: 1 } },
    });

    render(<CountsView isOwner={true} onBack={vi.fn()} />);

    const newBtn = screen.getByRole('button', { name: /Nuevo Conteo/i });
    fireEvent.click(newBtn);

    expect(screen.getByText('Nuevo Conteo Físico')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText('Nuevo Conteo Físico')).not.toBeInTheDocument();
    });
  });

  it('updates filters and displays error message when loading fails', async () => {
    vi.spyOn(inventoryCountsClient, 'listCounts').mockResolvedValue({
      ok: false,
      error: 'Error de red al consultar conteos',
    });

    render(<CountsView isOwner={true} onBack={vi.fn()} />);

    expect(await screen.findByText('Error de red al consultar conteos')).toBeInTheDocument();

    const selects = screen.getAllByRole('combobox');
    const locationSelect = selects[0];
    const statusSelect = selects[1];

    fireEvent.change(locationSelect, { target: { value: 'warehouse' } });
    expect(locationSelect.value).toBe('warehouse');

    fireEvent.change(statusSelect, { target: { value: 'applied' } });
    expect(statusSelect.value).toBe('applied');
  });
});
