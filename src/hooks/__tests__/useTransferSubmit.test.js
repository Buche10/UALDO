import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransferSubmit } from '../useTransferSubmit';
import * as inventoryClient from '../../services/inventoryClient';

describe('useTransferSubmit hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockItem = {
    id: 10,
    name: 'Carne de res',
    unit: 'kg',
    stock_by_location: {
      warehouse: 15,
      kitchen: 5,
      lounge: 0,
    },
  };

  it('validates that origin and destination must be different', async () => {
    const { result } = renderHook(() =>
      useTransferSubmit({ item: mockItem, onClose: vi.fn(), onTransferSuccess: vi.fn() })
    );

    await act(async () => {
      await result.current.submitTransfer({
        from: 'kitchen',
        to: 'kitchen',
        quantity: '2',
      });
    });

    expect(result.current.validationError).toBe('El origen y el destino deben ser diferentes.');
    expect(result.current.submitting).toBe(false);
  });

  it('validates that quantity must be valid and positive', async () => {
    const { result } = renderHook(() =>
      useTransferSubmit({ item: mockItem, onClose: vi.fn(), onTransferSuccess: vi.fn() })
    );

    await act(async () => {
      await result.current.submitTransfer({
        from: 'warehouse',
        to: 'kitchen',
        quantity: '0',
      });
    });

    expect(result.current.validationError).toContain('Ingresa una cantidad válida');
  });

  it('validates that quantity does not exceed origin stock', async () => {
    const { result } = renderHook(() =>
      useTransferSubmit({ item: mockItem, onClose: vi.fn(), onTransferSuccess: vi.fn() })
    );

    await act(async () => {
      await result.current.submitTransfer({
        from: 'kitchen',
        to: 'warehouse',
        quantity: '10',
      });
    });

    expect(result.current.validationError).toContain('supera el disponible en el origen');
  });

  it('executes successful transfer (201 created)', async () => {
    const spy = vi.spyOn(inventoryClient, 'transferStock').mockResolvedValue({
      ok: true,
      status: 201,
      data: {
        status: 'created',
        item: { ...mockItem },
      },
    });

    const onClose = vi.fn();
    const onTransferSuccess = vi.fn();

    const { result } = renderHook(() =>
      useTransferSubmit({ item: mockItem, onClose, onTransferSuccess })
    );

    await act(async () => {
      await result.current.submitTransfer({
        from: 'warehouse',
        to: 'kitchen',
        quantity: '3',
        reason: 'Uso en cocina',
      });
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(onTransferSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Transferencia realizada con éxito.',
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('handles idempotent success (200 idempotent)', async () => {
    vi.spyOn(inventoryClient, 'transferStock').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        status: 'idempotent',
        item: { ...mockItem },
      },
    });

    const onClose = vi.fn();
    const onTransferSuccess = vi.fn();

    const { result } = renderHook(() =>
      useTransferSubmit({ item: mockItem, onClose, onTransferSuccess })
    );

    await act(async () => {
      await result.current.submitTransfer({
        from: 'warehouse',
        to: 'kitchen',
        quantity: '2',
      });
    });

    expect(onTransferSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Ya estaba registrada',
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('handles 409 conflict error', async () => {
    vi.spyOn(inventoryClient, 'transferStock').mockResolvedValue({
      ok: false,
      status: 409,
      data: { message: 'Stock insuficiente en la ubicación de origen.' },
    });

    const { result } = renderHook(() =>
      useTransferSubmit({ item: mockItem, onClose: vi.fn(), onTransferSuccess: vi.fn() })
    );

    await act(async () => {
      await result.current.submitTransfer({
        from: 'warehouse',
        to: 'kitchen',
        quantity: '2',
      });
    });

    expect(result.current.error).toBe('Stock insuficiente en la ubicación de origen.');
  });

  it('regenerates uuid on 409 conflict when client_uuid ya usado', async () => {
    vi.spyOn(inventoryClient, 'transferStock').mockResolvedValue({
      ok: false,
      status: 409,
      data: { message: 'client_uuid ya usado por otro insumo' },
    });

    const { result } = renderHook(() =>
      useTransferSubmit({ item: mockItem, onClose: vi.fn(), onTransferSuccess: vi.fn() })
    );

    await act(async () => {
      await result.current.submitTransfer({
        from: 'warehouse',
        to: 'kitchen',
        quantity: '2',
      });
    });

    expect(result.current.error).toBe('client_uuid ya usado por otro insumo');
  });

  it('handles generic error response', async () => {
    vi.spyOn(inventoryClient, 'transferStock').mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Error inesperado del servidor',
    });

    const { result } = renderHook(() =>
      useTransferSubmit({ item: mockItem, onClose: vi.fn(), onTransferSuccess: vi.fn() })
    );

    await act(async () => {
      await result.current.submitTransfer({
        from: 'warehouse',
        to: 'kitchen',
        quantity: '2',
      });
    });

    expect(result.current.error).toBe('Error inesperado del servidor');
  });

  it('handles 422 validation errors with field errors', async () => {
    vi.spyOn(inventoryClient, 'transferStock').mockResolvedValue({
      ok: false,
      status: 422,
      data: {
        message: 'Datos inválidos',
        errors: { quantity: ['Cantidad no permitida'] },
      },
    });

    const { result } = renderHook(() =>
      useTransferSubmit({ item: mockItem, onClose: vi.fn(), onTransferSuccess: vi.fn() })
    );

    await act(async () => {
      await result.current.submitTransfer({
        from: 'warehouse',
        to: 'kitchen',
        quantity: '1',
      });
    });

    expect(result.current.fieldErrors).toEqual({ quantity: ['Cantidad no permitida'] });
    expect(result.current.error).toBe('Datos inválidos');
  });

  it('handles network error message', async () => {
    vi.spyOn(inventoryClient, 'transferStock').mockResolvedValue({
      ok: false,
      isNetworkError: true,
    });

    const { result } = renderHook(() =>
      useTransferSubmit({ item: mockItem, onClose: vi.fn(), onTransferSuccess: vi.fn() })
    );

    await act(async () => {
      await result.current.submitTransfer({
        from: 'warehouse',
        to: 'kitchen',
        quantity: '1',
      });
    });

    expect(result.current.error).toContain('Sin conexión');
  });

  it('clears state on initUuid', () => {
    const { result } = renderHook(() =>
      useTransferSubmit({ item: mockItem, onClose: vi.fn(), onTransferSuccess: vi.fn() })
    );

    act(() => {
      result.current.initUuid();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.fieldErrors).toEqual({});
    expect(result.current.validationError).toBeNull();
  });

  it('reuses the same client_uuid on retry after network error and generates fresh uuid after 201 (killing mutation)', async () => {
    const spy = vi.spyOn(inventoryClient, 'transferStock')
      .mockResolvedValueOnce({
        ok: false,
        isNetworkError: true,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        data: { status: 'created', item: mockItem },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        data: { status: 'created', item: mockItem },
      });

    const { result } = renderHook(() =>
      useTransferSubmit({ item: mockItem, onClose: vi.fn(), onTransferSuccess: vi.fn() })
    );

    act(() => {
      result.current.initUuid();
    });

    // 1st attempt: fails with network error
    await act(async () => {
      await result.current.submitTransfer({
        from: 'warehouse',
        to: 'kitchen',
        quantity: '1',
      });
    });

    const uuidAttempt1 = spy.mock.calls[0][1];
    expect(uuidAttempt1).toBeTruthy();

    // 2nd attempt (retry): must reuse the EXACT same client_uuid!
    await act(async () => {
      await result.current.submitTransfer({
        from: 'warehouse',
        to: 'kitchen',
        quantity: '1',
      });
    });

    const uuidAttempt2 = spy.mock.calls[1][1];
    expect(uuidAttempt2).toBe(uuidAttempt1);

    // 3rd attempt: after 201 success in attempt 2, uuid MUST be renewed!
    await act(async () => {
      await result.current.submitTransfer({
        from: 'warehouse',
        to: 'kitchen',
        quantity: '1',
      });
    });

    const uuidAttempt3 = spy.mock.calls[2][1];
    expect(uuidAttempt3).not.toBe(uuidAttempt1);
  });

  it('handles fallback error messages for 409 and 422 without detailed errors, and generic fallback', async () => {
    const spy = vi.spyOn(inventoryClient, 'transferStock');

    const { result } = renderHook(() =>
      useTransferSubmit({ item: mockItem, onClose: vi.fn(), onTransferSuccess: vi.fn() })
    );

    // 409 fallback
    spy.mockResolvedValueOnce({
      ok: false,
      status: 409,
      data: {},
    });
    await act(async () => {
      await result.current.submitTransfer({ from: 'warehouse', to: 'kitchen', quantity: '1' });
    });
    expect(result.current.error).toBe('Stock insuficiente en la ubicación de origen.');

    // 422 fallback without errors object
    spy.mockResolvedValueOnce({
      ok: false,
      status: 422,
      data: {},
    });
    await act(async () => {
      await result.current.submitTransfer({ from: 'warehouse', to: 'kitchen', quantity: '1' });
    });
    expect(result.current.error).toBe('Datos de la transferencia inválidos.');

    // Generic error with data.message
    spy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      data: { message: 'Operación no permitida' },
    });
    await act(async () => {
      await result.current.submitTransfer({ from: 'warehouse', to: 'kitchen', quantity: '1' });
    });
    expect(result.current.error).toBe('Operación no permitida');
  });
});
