import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CountSheet from '../CountSheet';
import * as inventoryClient from '../../../../services/inventoryClient';
import * as inventoryCountsClient from '../../../../services/inventoryCountsClient';

describe('CountSheet component', () => {
  const mockCount = {
    id: 15,
    location: 'kitchen',
    location_label: 'Cocina',
    status: 'draft',
    notes: 'Conteo reapertura cocina',
    lines: [
      { item_id: 1, counted_quantity: '4' },
    ],
  };

  const mockItems = [
    {
      id: 1,
      name: 'Tomate de riñón',
      unit: 'kg',
      type: 'ingredient',
      stock_by_location: { kitchen: 5 },
    },
    {
      id: 2,
      name: 'Cebolla paiteña',
      unit: 'kg',
      type: 'ingredient',
      stock_by_location: { kitchen: 3 },
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: mockCount },
    });
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: { items: mockItems, meta: { last_page: 1 } },
    });
  });

  it('renders count header, blind count toggle, and inventory rows', async () => {
    render(<CountSheet countId={15} onBack={vi.fn()} onAppliedComplete={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Planilla de Conteo: Cocina')).toBeInTheDocument();
      expect(screen.getByText('Conteo reapertura cocina')).toBeInTheDocument();
      expect(screen.getByText('Tomate de riñón')).toBeInTheDocument();
      expect(screen.getByText('Cebolla paiteña')).toBeInTheDocument();
    });

    // Blind count should be active by default
    expect(screen.getByText('(Conteo a ciegas activo)')).toBeInTheDocument();
    expect(screen.queryByText(/Sistema:\s*5/)).not.toBeInTheDocument();

    // Click toggle to reveal system stock
    const toggleBtn = screen.getByRole('button', { name: /Ver cantidad del sistema/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText(/Sistema: 5 kg/)).toBeInTheDocument();
    expect(screen.getByText(/Sistema: 3 kg/)).toBeInTheDocument();
    expect(screen.getByText('(Conteo a ciegas desactivado)')).toBeInTheDocument();
  });

  it('filters items by search input', async () => {
    render(<CountSheet countId={15} onBack={vi.fn()} onAppliedComplete={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Tomate de riñón')).toBeInTheDocument();
      expect(screen.getByText('Cebolla paiteña')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar insumo por nombre o código...');
    fireEvent.change(searchInput, { target: { value: 'Tomate' } });

    expect(screen.getByText('Tomate de riñón')).toBeInTheDocument();
    expect(screen.queryByText('Cebolla paiteña')).not.toBeInTheDocument();
  });

  it('updates counted quantity and allows saving progress', async () => {
    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines').mockResolvedValue({
      ok: true,
      data: { status: 'saved' },
    });

    render(<CountSheet countId={15} onBack={vi.fn()} onAppliedComplete={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Cebolla paiteña')).toBeInTheDocument();
    });

    const cebollaInput = screen.getByLabelText('Cebolla paiteña');
    fireEvent.change(cebollaInput, { target: { value: '2.5' } });

    expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /Guardar avance/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith(15, [
        { item_id: 2, counted_quantity: '2.5' },
      ]);
    });
  });

  it('calls onBack when back button is clicked', async () => {
    const onBack = vi.fn();
    render(<CountSheet countId={15} onBack={onBack} onAppliedComplete={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Planilla de Conteo: Cocina')).toBeInTheDocument();
    });

    const backBtn = screen.getByRole('button', { name: /Volver a conteos/i });
    fireEvent.click(backBtn);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('saves pending lines before navigating back; if save fails, shows error and does not exit', async () => {
    const onBack = vi.fn();
    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines').mockResolvedValue({
      ok: false,
      status: 422,
      error: 'Error al guardar cambios pendientes',
    });

    render(<CountSheet countId={15} onBack={onBack} onAppliedComplete={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Cebolla paiteña')).toBeInTheDocument();
    });

    const cebollaInput = screen.getByLabelText('Cebolla paiteña');
    fireEvent.change(cebollaInput, { target: { value: '2.5' } });

    expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument();

    const backBtn = screen.getByRole('button', { name: /Volver a conteos/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalled();
    });

    expect(onBack).not.toHaveBeenCalled();
    expect(screen.getByText(/Error al guardar cambios pendientes/i)).toBeInTheDocument();
  });

  it('saves pending lines before navigating back and calls onBack if save succeeds', async () => {
    const onBack = vi.fn();
    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines').mockResolvedValue({
      ok: true,
      data: { status: 'saved' },
    });

    render(<CountSheet countId={15} onBack={onBack} onAppliedComplete={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Cebolla paiteña')).toBeInTheDocument();
    });

    const cebollaInput = screen.getByLabelText('Cebolla paiteña');
    fireEvent.change(cebollaInput, { target: { value: '2.5' } });

    const backBtn = screen.getByRole('button', { name: /Volver a conteos/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalled();
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  it('allows owner to cancel draft count via custom confirmation dialog and handles 409', async () => {
    const onBack = vi.fn();
    const cancelSpy = vi.spyOn(inventoryCountsClient, 'cancelCount').mockResolvedValueOnce({
      ok: false,
      status: 409,
      data: { message: 'El conteo ya estaba cerrado.' },
    });

    render(<CountSheet countId={15} onBack={onBack} onAppliedComplete={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancelar conteo/i })).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole('button', { name: /Cancelar conteo/i });
    fireEvent.click(cancelBtn);

    // Confirmation dialog appears with exact text
    expect(screen.getByText('El conteo se cancela y no cambia el stock. No se puede deshacer.')).toBeInTheDocument();

    const confirmCancelBtn = screen.getByRole('button', { name: /Confirmar cancelación/i });
    fireEvent.click(confirmCancelBtn);

    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledWith(15);
      expect(screen.getByText(/El conteo ya estaba cerrado/i)).toBeInTheDocument();
      expect(onBack).not.toHaveBeenCalled();
    });

    // Now test successful cancellation
    cancelSpy.mockResolvedValueOnce({
      ok: true,
      data: { status: 'cancelled' },
    });

    fireEvent.click(confirmCancelBtn);

    await waitFor(() => {
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });
});
