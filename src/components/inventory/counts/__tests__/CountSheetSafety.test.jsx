import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CountSheet from '../CountSheet';
import * as inventoryClient from '../../../../services/inventoryClient';
import * as inventoryCountsClient from '../../../../services/inventoryCountsClient';

/**
 * Salir de la planilla sin perder cambios, aviso de cantidad ya guardada y
 * texto plano (Brief 19p_fix2).
 */
describe('CountSheet safety', () => {
  const xss = '<img src=x onerror=alert(1)>';
  const items = [
    { id: 1, name: 'Tomate', unit: 'kg', type: 'ingredient', stock_by_location: { kitchen: 5 } },
    { id: 2, name: xss, unit: 'kg', type: 'ingredient', stock_by_location: { kitchen: 3 } },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: { id: 7, location: 'kitchen', location_label: 'Cocina', status: 'draft', lines: [{ item_id: 1, counted_quantity: '4' }] } },
    });
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({ ok: true, data: { items, meta: { last_page: 1 } } });
  });

  async function renderSheet(onBack = vi.fn()) {
    render(<CountSheet countId={7} onBack={onBack} onAppliedComplete={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText('Tomate')).toHaveValue('4'));
    return onBack;
  }

  it('after a failed save, going back saves again and stays if it fails again', async () => {
    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines').mockResolvedValue({ ok: false, status: 500, error: 'Sin conexión' });
    const onBack = await renderSheet();

    fireEvent.change(screen.getByLabelText('Tomate'), { target: { value: '6' } });
    fireEvent.click(screen.getByText('Guardar avance'));
    await waitFor(() => expect(screen.getByText('Sin conexión')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Volver a conteos'));
    await waitFor(() => expect(saveSpy).toHaveBeenCalledTimes(2));
    expect(onBack).not.toHaveBeenCalled();
  });

  it('going back during a save waits, saves the edits made meanwhile and then leaves', async () => {
    let resolveFirst;
    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines')
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce({ ok: true, data: { status: 'saved' } });
    const onBack = await renderSheet();

    fireEvent.change(screen.getByLabelText('Tomate'), { target: { value: '6' } });
    fireEvent.click(screen.getByText('Guardar avance'));
    fireEvent.change(screen.getByLabelText('Tomate'), { target: { value: '7' } });
    fireEvent.click(screen.getByText('Volver a conteos'));
    expect(onBack).not.toHaveBeenCalled();

    await act(async () => {
      resolveFirst({ ok: true, data: { status: 'saved' } });
    });

    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
    expect(saveSpy).toHaveBeenCalledTimes(2);
    expect(saveSpy).toHaveBeenLastCalledWith(7, [{ item_id: 1, counted_quantity: '7' }]);
  });

  it('a line with an invalid quantity blocks leaving and is marked next to the item', async () => {
    vi.spyOn(inventoryCountsClient, 'saveCountLines').mockResolvedValue({ ok: true, data: { status: 'saved' } });
    const onBack = await renderSheet();

    fireEvent.change(screen.getByLabelText('Tomate'), { target: { value: '1.2345' } });
    expect(screen.getByText('Usa solo números, con 3 decimales como máximo.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Volver a conteos'));
    await waitFor(() => expect(screen.getByText('Hay cantidades por corregir')).toBeInTheDocument());
    expect(onBack).not.toHaveBeenCalled();
  });

  it('clearing a saved quantity explains that the engine keeps it', async () => {
    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines');
    const onBack = await renderSheet();

    fireEvent.change(screen.getByLabelText('Tomate'), { target: { value: '' } });
    expect(screen.getByText(/Ya hay 4 guardada en el motor/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Volver a conteos'));
    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('shows item names as plain text', async () => {
    const { container } = render(<CountSheet countId={7} onBack={vi.fn()} onAppliedComplete={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(xss)).toBeInTheDocument());
    expect(container.querySelector('img')).toBeNull();
  });
});
