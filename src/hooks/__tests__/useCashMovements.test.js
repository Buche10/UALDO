import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCashMovements } from '../useCashMovements';
import * as cashMovementsClient from '../../services/cashMovementsClient';

describe('useCashMovements hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('carga la lista de movimientos y totales en loadData', async () => {
    vi.spyOn(cashMovementsClient, 'listMovements').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        data: [{ id: 1, kind: 'pago_efectivo', amount: 45.2 }],
        meta: { current_page: 1, last_page: 1, total: 1 },
        totals: { gastos_diarios: 45.2 }
      }
    });

    const { result } = renderHook(() => useCashMovements({ fecha: '2026-10-05' }));

    await act(async () => {
      await result.current.loadData(1);
    });

    expect(result.current.movements.length).toBe(1);
    expect(result.current.totals.gastos_diarios).toBe(45.2);
  });

  it('permite abrir y cerrar modales de alta y anulacion', () => {
    const { result } = renderHook(() => useCashMovements({ fecha: '2026-10-05' }));

    act(() => {
      result.current.openAddModal();
    });
    expect(result.current.showAddModal).toBe(true);

    act(() => {
      result.current.closeAddModal();
    });
    expect(result.current.showAddModal).toBe(false);

    act(() => {
      result.current.openVoidModal({ id: 99 });
    });
    expect(result.current.showVoidModal).toBe(true);
    expect(result.current.movementToVoid?.id).toBe(99);

    act(() => {
      result.current.closeVoidModal();
    });
    expect(result.current.showVoidModal).toBe(false);
  });

  it('anula movimiento con submitVoid validando el motivo', async () => {
    const voidSpy = vi.spyOn(cashMovementsClient, 'voidMovement').mockResolvedValue({
      ok: true,
      status: 200,
      data: { id: 1, anulado: true }
    });

    const { result } = renderHook(() => useCashMovements({ fecha: '2026-10-05' }));

    act(() => {
      result.current.openVoidModal({ id: 1 });
    });

    // Sin motivo da error y no llama
    await act(async () => {
      await result.current.submitVoid();
    });
    expect(result.current.voidError).toBe('El motivo de anulación es obligatorio.');
    expect(voidSpy).not.toHaveBeenCalled();

    // Con motivo ejecuta la llamada
    act(() => {
      result.current.setVoidReason('Error en factura');
    });

    await act(async () => {
      await result.current.submitVoid();
    });

    expect(voidSpy).toHaveBeenCalledWith(1, 'Error en factura');
    expect(result.current.showVoidModal).toBe(false);
    expect(result.current.successBanner).toBe('Movimiento anulado.');
  });
});
