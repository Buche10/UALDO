import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PurchaseOutcomePanel from '../PurchaseOutcomePanel';
import * as supplyRequestsClient from '../../../services/supplyRequestsClient';

describe('PurchaseOutcomePanel component (Brief 33p)', () => {
  const approvedRequests = [
    {
      id: 10,
      requester: { name: 'Juan' },
      items: [
        { id: 101, name: 'Pechuga de pollo', quantity: 10, unit: 'kg' },
        { id: 102, name: 'Aceite de oliva', quantity: 5, unit: 'L' },
      ],
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(supplyRequestsClient, 'listRequests').mockResolvedValue({
      ok: true,
      data: { data: approvedRequests },
    });
  });

  it('renders all items and outcome buttons after loading', async () => {
    render(<PurchaseOutcomePanel onBack={vi.fn()} onSaved={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Pechuga de pollo')).toBeInTheDocument();
      expect(screen.getByText('Aceite de oliva')).toBeInTheDocument();
    });

    expect(screen.getAllByRole('button', { name: 'Comprado' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Parcial' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'No comprado' })).toHaveLength(2);
  });

  it('demands a note/reason when selecting Parcial or No comprado', async () => {
    render(<PurchaseOutcomePanel onBack={vi.fn()} onSaved={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Pechuga de pollo')).toBeInTheDocument());

    // Click Parcial on first item
    fireEvent.click(screen.getAllByRole('button', { name: 'Parcial' })[0]);
    expect(screen.getByPlaceholderText(/Motivo/)).toBeInTheDocument();

    // Try to save without note/quantity
    fireEvent.click(screen.getByRole('button', { name: /Guardar resultados/ }));
    expect(screen.getByText(/Indica la cantidad comprada para Pechuga de pollo\./)).toBeInTheDocument();
  });

  it('saves batch outcomes when valid', async () => {
    const saveSpy = vi.spyOn(supplyRequestsClient, 'savePurchaseOutcome').mockResolvedValue({
      ok: true,
      data: { success: true },
    });
    const onSaved = vi.fn();

    render(<PurchaseOutcomePanel onBack={vi.fn()} onSaved={onSaved} />);

    await waitFor(() => expect(screen.getByText('Pechuga de pollo')).toBeInTheDocument());

    // Item 1: Comprado
    fireEvent.click(screen.getAllByRole('button', { name: 'Comprado' })[0]);

    // Item 2: Parcial with quantity and note
    fireEvent.click(screen.getAllByRole('button', { name: 'Parcial' })[1]);
    fireEvent.change(screen.getByPlaceholderText(/Cantidad comprada/), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Motivo/), {
      target: { value: 'Solo tenian 3 litros' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Guardar resultados/ }));

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith([
        { supply_request_item_id: 101, outcome: 'purchased' },
        {
          supply_request_item_id: 102,
          outcome: 'partial',
          purchased_quantity: '3',
          reason: 'Solo tenian 3 litros',
        },
      ]);
      expect(onSaved).toHaveBeenCalled();
    });
  });
});
