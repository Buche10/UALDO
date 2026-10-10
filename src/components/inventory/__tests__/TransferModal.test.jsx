import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TransferModal from '../TransferModal';
import * as inventoryClient from '../../../services/inventoryClient';

describe('TransferModal component', () => {
  const mockItem = {
    id: 42,
    name: 'Aceite de oliva',
    unit: 'l',
    stock_by_location: {
      warehouse: 10.5,
      kitchen: 2,
      lounge: 0,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when isOpen is false or item is null', () => {
    const { container, rerender } = render(
      <TransferModal isOpen={false} item={mockItem} onClose={vi.fn()} onTransferSuccess={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();

    rerender(
      <TransferModal isOpen={true} item={null} onClose={vi.fn()} onTransferSuccess={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal contents, selects and origin stock', () => {
    render(
      <TransferModal isOpen={true} item={mockItem} onClose={vi.fn()} onTransferSuccess={vi.fn()} />
    );

    expect(screen.getByText('Transferir Stock')).toBeDefined();
    expect(screen.getByText('Aceite de oliva')).toBeDefined();
    expect(screen.getByLabelText('Origen')).toBeDefined();
    expect(screen.getByLabelText('Destino')).toBeDefined();
    expect(screen.getByText(/Disponible en el origen:/)).toBeDefined();
    expect(screen.getByText(/10,5 l/)).toBeDefined();
  });

  it('updates available stock when origin selection changes', () => {
    render(
      <TransferModal isOpen={true} item={mockItem} onClose={vi.fn()} onTransferSuccess={vi.fn()} />
    );

    const fromSelect = screen.getByLabelText('Origen');
    fireEvent.change(fromSelect, { target: { value: 'kitchen' } });

    expect(screen.getByText(/2 l/)).toBeDefined();
  });

  it('submits transfer when valid data is entered', async () => {
    const spy = vi.spyOn(inventoryClient, 'transferStock').mockResolvedValue({
      ok: true,
      status: 201,
      data: { status: 'created', item: mockItem },
    });

    const onClose = vi.fn();
    const onTransferSuccess = vi.fn();

    render(
      <TransferModal
        isOpen={true}
        item={mockItem}
        onClose={onClose}
        onTransferSuccess={onTransferSuccess}
      />
    );

    const qtyInput = screen.getByPlaceholderText('Ej: 2.500');
    fireEvent.change(qtyInput, { target: { value: '3' } });

    const reasonInput = screen.getByPlaceholderText('Ej: Reposición de cocina');
    fireEvent.change(reasonInput, { target: { value: 'Llenado de botellas' } });

    const submitBtn = screen.getByRole('button', { name: /Transferir/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(onTransferSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('displays client validation error if origin equals destination', async () => {
    render(
      <TransferModal isOpen={true} item={mockItem} onClose={vi.fn()} onTransferSuccess={vi.fn()} />
    );

    const destSelect = screen.getByLabelText('Destino');
    fireEvent.change(destSelect, { target: { value: 'warehouse' } });

    const submitBtn = screen.getByRole('button', { name: /Transferir/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('El origen y el destino deben ser diferentes.')).toBeDefined();
  });

  it('closes on escape key or cancel button', () => {
    const onClose = vi.fn();
    render(
      <TransferModal isOpen={true} item={mockItem} onClose={onClose} onTransferSuccess={vi.fn()} />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('renders field errors for quantity and reason from 422 backend response', async () => {
    vi.spyOn(inventoryClient, 'transferStock').mockResolvedValue({
      ok: false,
      status: 422,
      data: {
        message: 'Validación fallida',
        errors: {
          quantity: ['La cantidad supera el límite'],
          reason: 'El motivo es inválido',
        },
      },
    });

    render(
      <TransferModal isOpen={true} item={mockItem} onClose={vi.fn()} onTransferSuccess={vi.fn()} />
    );

    const qtyInput = screen.getByPlaceholderText('Ej: 2.500');
    fireEvent.change(qtyInput, { target: { value: '1' } });

    const submitBtn = screen.getByRole('button', { name: /Transferir/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('La cantidad supera el límite')).toBeInTheDocument();
    expect(await screen.findByText('El motivo es inválido')).toBeInTheDocument();
  });
});
