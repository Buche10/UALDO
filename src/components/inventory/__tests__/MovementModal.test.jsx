import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MovementModal from '../MovementModal';
import * as inventoryClient from '../../../services/inventoryClient';

describe('MovementModal component', () => {
  const item = {
    id: 42,
    name: 'Carne de Res Molida',
    unit: 'kg',
    current_stock: '15.000',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('converts comma to dot in quantity and rejects invalid decimals or negative numbers', async () => {
    const registerSpy = vi.spyOn(inventoryClient, 'registerMovement').mockResolvedValue({
      ok: true,
      status: 201,
      data: { message: 'Movimiento registrado' },
    });

    render(<MovementModal isOpen={true} item={item} onClose={vi.fn()} onMovementRegistered={vi.fn()} />);

    const quantityInput = screen.getByLabelText(/Cantidad/i);
    const submitBtn = screen.getByRole('button', { name: /^Registrar$/i });

    // Try negative number
    fireEvent.change(quantityInput, { target: { value: '-2.5' } });
    fireEvent.click(submitBtn);
    expect(screen.getByText(/Ingresa una cantidad válida/i)).toBeInTheDocument();
    expect(registerSpy).not.toHaveBeenCalled();

    // Try more than 3 decimals
    fireEvent.change(quantityInput, { target: { value: '2.1234' } });
    fireEvent.click(submitBtn);
    expect(screen.getByText(/Ingresa una cantidad válida/i)).toBeInTheDocument();
    expect(registerSpy).not.toHaveBeenCalled();

    // Valid with comma "2,5"
    fireEvent.change(quantityInput, { target: { value: '2,5' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledTimes(1);
    });

    const payload = registerSpy.mock.calls[0][1];
    expect(payload.quantity).toBe('2.5');
  });

  it('reuses the same client_uuid across network retries until success', async () => {
    let callCount = 0;
    const capturedUuids = [];

    vi.spyOn(inventoryClient, 'registerMovement').mockImplementation((id, data, clientUuid) => {
      callCount++;
      capturedUuids.push(clientUuid || data.client_uuid);
      if (callCount === 1) {
        // Network failure
        return Promise.resolve({
          ok: false,
          isNetworkError: true,
          error: 'Error de conexion con el motor',
        });
      }
      // Retry succeeds
      return Promise.resolve({
        ok: true,
        status: 201,
        data: { message: 'Movimiento registrado' },
      });
    });

    const handleSuccess = vi.fn();
    render(<MovementModal isOpen={true} item={item} onClose={vi.fn()} onMovementRegistered={handleSuccess} />);

    const quantityInput = screen.getByLabelText(/Cantidad/i);
    fireEvent.change(quantityInput, { target: { value: '3.5' } });
    const submitBtn = screen.getByRole('button', { name: /^Registrar$/i });

    // First attempt -> fails
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Sin conexión. Tu movimiento no se registró/i)).toBeInTheDocument();
    });

    // Second attempt without closing modal -> retries
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledTimes(1);
    });

    expect(capturedUuids.length).toBe(2);
    // Crucial: The UUID MUST be identical across retries
    expect(capturedUuids[0]).toBe(capturedUuids[1]);
    expect(capturedUuids[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('handles 409 conflict and presents clear message', async () => {
    vi.spyOn(inventoryClient, 'registerMovement').mockResolvedValue({
      ok: false,
      status: 409,
      error: 'Stock insuficiente para descontar la cantidad requerida',
    });

    render(<MovementModal isOpen={true} item={item} onClose={vi.fn()} onMovementRegistered={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Cantidad/i), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: /^Registrar$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Stock insuficiente/i)).toBeInTheDocument();
    });
  });

  it('handles 409 conflict when client_uuid was used by another item, displays generic message and generates fresh UUID for next submission', async () => {
    const capturedUuids = [];
    vi.spyOn(inventoryClient, 'registerMovement').mockImplementation((id, data, clientUuid) => {
      capturedUuids.push(clientUuid || data.client_uuid);
      if (capturedUuids.length === 1) {
        return Promise.resolve({
          ok: false,
          status: 409,
          data: { message: 'El client_uuid ya usado en otro insumo' },
        });
      }
      return Promise.resolve({
        ok: true,
        status: 201,
        data: { message: 'Movimiento registrado con exito' },
      });
    });

    render(<MovementModal isOpen={true} item={item} onClose={vi.fn()} onMovementRegistered={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Cantidad/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /^Registrar$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Ocurrió un conflicto de identificador. Se ha generado uno nuevo/i)).toBeInTheDocument();
    });

    // Submit again after conflict
    fireEvent.click(screen.getByRole('button', { name: /^Registrar$/i }));

    await waitFor(() => {
      expect(capturedUuids.length).toBe(2);
    });

    expect(capturedUuids[0]).not.toBe(capturedUuids[1]);
    expect(capturedUuids[1]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('displays 422 field errors next to inputs', async () => {
    vi.spyOn(inventoryClient, 'registerMovement').mockResolvedValue({
      ok: false,
      status: 422,
      error: 'Datos del movimiento inválidos.',
      data: {
        errors: {
          quantity: ['La cantidad debe ser mayor a 0.'],
          reason: ['El motivo excede los 255 caracteres.'],
        },
      },
    });

    render(<MovementModal isOpen={true} item={item} onClose={vi.fn()} onMovementRegistered={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Cantidad/i), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /^Registrar$/i }));

    await waitFor(() => {
      expect(screen.getByText('La cantidad debe ser mayor a 0.')).toBeInTheDocument();
      expect(screen.getByText('El motivo excede los 255 caracteres.')).toBeInTheDocument();
    });
  });

  it('accepts 200 as idempotent success when client_uuid was already processed', async () => {
    vi.spyOn(inventoryClient, 'registerMovement').mockResolvedValue({
      ok: true,
      status: 200,
      data: { status: 'idempotent', message: 'Movimiento ya registrado previamente' },
    });

    const handleSuccess = vi.fn();
    render(<MovementModal isOpen={true} item={item} onClose={vi.fn()} onMovementRegistered={handleSuccess} />);

    fireEvent.change(screen.getByLabelText(/Cantidad/i), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /^Registrar$/i }));

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
