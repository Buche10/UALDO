import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CashMovementsPanel from '../CashMovementsPanel';
import * as cashMovementsClient from '../../../services/cashMovementsClient';

describe('CashMovementsPanel component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockMovementsData = {
    data: [
      {
        id: 1,
        kind: 'pago_efectivo',
        kind_label: 'pago en efectivo',
        counterparty: 'Proveedor Verduras',
        amount: 35.0,
        note: 'Cebollas y papas',
        anulado: false,
        created_by: { name: 'Roberto' }
      },
      {
        id: 2,
        kind: 'deposito',
        kind_label: 'depósito',
        counterparty: '',
        amount: 150.0,
        note: 'Depósito diario',
        anulado: true,
        created_by: { name: 'Admin' }
      }
    ],
    meta: { current_page: 1, last_page: 1, total: 2 },
    totals: {
      gastos_diarios: 35.0,
      por_tipo: { pago_efectivo: 35.0 }
    }
  };

  it('renderiza la lista de movimientos y los totales del servidor', async () => {
    vi.spyOn(cashMovementsClient, 'listMovements').mockResolvedValue({
      ok: true,
      status: 200,
      data: mockMovementsData
    });

    render(<CashMovementsPanel fecha="2026-10-05" onMovementChanged={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('pago en efectivo')).toBeInTheDocument();
      expect(screen.getByText('(Proveedor Verduras)')).toBeInTheDocument();
      expect(screen.getAllByText('USD 35,00').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Anulado')).toBeInTheDocument();
    });
  });

  it('permite anular un movimiento con motivo y llama a onMovementChanged', async () => {
    vi.spyOn(cashMovementsClient, 'listMovements').mockResolvedValue({
      ok: true,
      status: 200,
      data: mockMovementsData
    });

    const voidSpy = vi.spyOn(cashMovementsClient, 'voidMovement').mockResolvedValue({
      ok: true,
      status: 200,
      data: { id: 1, anulado: true }
    });

    const onMovementChanged = vi.fn();
    render(<CashMovementsPanel fecha="2026-10-05" onMovementChanged={onMovementChanged} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Anular')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Anular'));

    expect(screen.getByText('Anular Movimiento')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Indica por qué se anula/i);
    fireEvent.change(textarea, { target: { value: 'Registro duplicado por error' } });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar Anulación/i }));

    await waitFor(() => {
      expect(voidSpy).toHaveBeenCalledWith(1, 'Registro duplicado por error');
      expect(onMovementChanged).toHaveBeenCalled();
    });
  });

  it('permite registrar un movimiento validando contraparte y monto', async () => {
    vi.spyOn(cashMovementsClient, 'listMovements').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [], meta: { current_page: 1, last_page: 1 }, totals: { gastos_diarios: 0 } }
    });

    const createSpy = vi.spyOn(cashMovementsClient, 'createMovement').mockImplementation(async (payload) => {
      if (!payload.counterparty?.trim()) {
        return { ok: false, status: 400, error: 'La contraparte es obligatoria para este tipo de movimiento.' };
      }
      return { ok: true, status: 201, data: { id: 2 } };
    });

    const onMovementChanged = vi.fn();
    render(<CashMovementsPanel fecha="2026-10-05" onMovementChanged={onMovementChanged} />);

    await waitFor(() => {
      expect(screen.getByText('Registrar movimiento')).toBeInTheDocument();
    });

    // Abrir modal
    fireEvent.click(screen.getByText('Registrar movimiento'));
    expect(screen.getByText('Registrar Movimiento')).toBeInTheDocument();

    // Intentar registrar sin contraparte (para pago_transferencia o pago_efectivo por defecto)
    fireEvent.click(screen.getByRole('button', { name: /^Registrar$/i }));
    await waitFor(() => {
      expect(screen.getByText(/La contraparte es obligatoria/i)).toBeInTheDocument();
    });

    // Llenar formulario valido
    const counterpartyInput = screen.getByPlaceholderText(/Proveedor o persona/i);
    fireEvent.change(counterpartyInput, { target: { value: 'Distribuidora ABC' } });

    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '45.50' } });

    fireEvent.click(screen.getByRole('button', { name: /^Registrar$/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        business_date: '2026-10-05',
        counterparty: 'Distribuidora ABC',
        amount: '45.50'
      }), expect.any(String));
      expect(onMovementChanged).toHaveBeenCalled();
    });
  });

  it('permite cargar mas movimientos cuando hay multiples paginas', async () => {
    const listSpy = vi.spyOn(cashMovementsClient, 'listMovements')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          data: [{ id: 1, kind: 'deposito', amount: 50, anulado: false }],
          meta: { current_page: 1, last_page: 2 },
          totals: { gastos_diarios: 0 }
        }
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          data: [{ id: 2, kind: 'caja_chica', amount: 20, anulado: false }],
          meta: { current_page: 2, last_page: 2 },
          totals: { gastos_diarios: 20 }
        }
      });

    render(<CashMovementsPanel fecha="2026-10-05" onMovementChanged={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Cargar más')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cargar más'));

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith('2026-10-05', 2);
    });
  });
});
