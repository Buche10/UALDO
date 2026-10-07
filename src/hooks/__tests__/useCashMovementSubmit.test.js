import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCashMovementSubmit, generateClientUuid } from '../useCashMovementSubmit';
import * as cashMovementsClient from '../../services/cashMovementsClient';

describe('useCashMovementSubmit hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reutiliza el client_uuid tras un error de red y genera uno nuevo tras un 201', async () => {
    let capturedUuids = [];
    const createSpy = vi.spyOn(cashMovementsClient, 'createMovement').mockImplementation(async (payload, uuid) => {
      capturedUuids.push(uuid);
      if (capturedUuids.length === 1) {
        return { ok: false, isNetworkError: true };
      }
      return { ok: true, status: 201, data: { id: 10 } };
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useCashMovementSubmit({ businessDate: '2026-10-05', onSuccess })
    );

    const firstUuid = result.current.getClientUuid();

    // Intento 1: falla por error de red
    await act(async () => {
      await result.current.submitMovement({
        kind: 'pago_efectivo',
        counterparty: 'Don Pepe',
        amount: '15.00',
        note: 'Compra'
      });
    });

    expect(result.current.error).toContain('Error de conexion');
    expect(capturedUuids[0]).toBe(firstUuid);
    expect(result.current.getClientUuid()).toBe(firstUuid); // Reutiliza el mismo UUID

    // Intento 2: exito (201)
    await act(async () => {
      await result.current.submitMovement({
        kind: 'pago_efectivo',
        counterparty: 'Don Pepe',
        amount: '15.00',
        note: 'Compra'
      });
    });

    expect(capturedUuids[1]).toBe(firstUuid);
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Movimiento registrado con exito.',
      isIdempotent: false
    }));
    // Tras 201 se genera un UUID nuevo
    expect(result.current.getClientUuid()).not.toBe(firstUuid);
  });

  it('muestra "Ya estaba registrado" con respuesta 200 idempotente y renueva UUID', async () => {
    vi.spyOn(cashMovementsClient, 'createMovement').mockResolvedValue({
      ok: true,
      status: 200,
      data: { id: 10 }
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useCashMovementSubmit({ businessDate: '2026-10-05', onSuccess })
    );

    const initialUuid = result.current.getClientUuid();

    await act(async () => {
      await result.current.submitMovement({
        kind: 'deposito',
        amount: '100.00'
      });
    });

    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Ya estaba registrado',
      isIdempotent: true
    }));
    expect(result.current.getClientUuid()).not.toBe(initialUuid);
  });

  it('maneja 409 generando un nuevo uuid y mostrando error generico', async () => {
    vi.spyOn(cashMovementsClient, 'createMovement').mockResolvedValue({
      ok: false,
      status: 409,
      error: 'Conflicto de UUID'
    });

    const { result } = renderHook(() =>
      useCashMovementSubmit({ businessDate: '2026-10-05' })
    );

    const initialUuid = result.current.getClientUuid();

    await act(async () => {
      await result.current.submitMovement({
        kind: 'deposito',
        amount: '100.00'
      });
    });

    expect(result.current.error).toContain('Conflicto');
    expect(result.current.getClientUuid()).not.toBe(initialUuid);
  });

  it('maneja 422 con errores de campo y mensaje de error', async () => {
    vi.spyOn(cashMovementsClient, 'createMovement').mockResolvedValue({
      ok: false,
      status: 422,
      data: {
        message: 'Datos invalidos',
        errors: { amount: ['El monto es obligatorio'] }
      }
    });

    const { result } = renderHook(() =>
      useCashMovementSubmit({ businessDate: '2026-10-05' })
    );

    await act(async () => {
      await result.current.submitMovement({
        kind: 'deposito',
        amount: ''
      });
    });

    expect(result.current.error).toBe('Datos invalidos');
    expect(result.current.fieldErrors).toEqual({ amount: ['El monto es obligatorio'] });
  });

  it('llama a onClose al registrar exitosamente y maneja error generico 500', async () => {
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useCashMovementSubmit({ businessDate: '2026-10-05', onClose })
    );

    // Error generico
    vi.spyOn(cashMovementsClient, 'createMovement').mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Error interno del servidor'
    });

    await act(async () => {
      await result.current.submitMovement({
        kind: 'deposito',
        amount: '10.00'
      });
    });

    expect(result.current.error).toBe('Error interno del servidor');
    expect(onClose).not.toHaveBeenCalled();

    // initUuid limpia error
    act(() => {
      result.current.initUuid();
    });
    expect(result.current.error).toBeNull();

    // Exito llama a onClose
    vi.spyOn(cashMovementsClient, 'createMovement').mockResolvedValue({
      ok: true,
      status: 201,
      data: { id: 1 }
    });

    await act(async () => {
      await result.current.submitMovement({
        kind: 'deposito',
        amount: '10.00'
      });
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('generateClientUuid genera uuids con fallbacks si crypto.randomUUID no existe', () => {
    // Caso 1: estandar
    const uuid1 = generateClientUuid();
    expect(uuid1).toMatch(/^[0-9a-f-]{36}$/i);

    // Caso 2: sin randomUUID pero con getRandomValues
    const origRandomUuid = crypto.randomUUID;
    try {
      crypto.randomUUID = undefined;
      const uuid2 = generateClientUuid();
      expect(uuid2).toMatch(/^[0-9a-f-]{36}$/i);

      // Caso 3: sin crypto
      const origGetRandomValues = crypto.getRandomValues;
      crypto.getRandomValues = undefined;
      const uuid3 = generateClientUuid();
      expect(uuid3).toContain('uuid-');
      crypto.getRandomValues = origGetRandomValues;
    } finally {
      crypto.randomUUID = origRandomUuid;
    }
  });
});
