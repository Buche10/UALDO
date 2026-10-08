import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePaymentMappings } from '../usePaymentMappings';
import * as cashConfigClient from '../../services/cashConfigClient';

describe('usePaymentMappings hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockMappings = [
    { id: 1, runfood_forma_pago_id: 101, bucket: 'efectivo', confirmado: true }
  ];

  it('maneja error al cargar mapeos', async () => {
    vi.spyOn(cashConfigClient, 'listPaymentMappings').mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Error de servidor'
    });

    const { result } = renderHook(() => usePaymentMappings());

    await act(async () => {
      await result.current.fetchMappings();
    });

    expect(result.current.error).toBe('Error de servidor');
  });

  it('maneja error al aceptar sugerencia y al asignar cubeta', async () => {
    vi.spyOn(cashConfigClient, 'listPaymentMappings').mockResolvedValue({
      ok: true,
      status: 200,
      data: mockMappings
    });

    vi.spyOn(cashConfigClient, 'acceptSuggestion').mockResolvedValue({
      ok: false,
      status: 422,
      error: 'Falla al aceptar sugerencia'
    });

    vi.spyOn(cashConfigClient, 'assignBucket').mockResolvedValue({
      ok: false,
      status: 422,
      error: 'Falla al asignar cubeta'
    });

    const { result } = renderHook(() => usePaymentMappings());

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      const res = await result.current.handleAcceptSuggestion(mockMappings[0]);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Falla al aceptar sugerencia');
    });

    act(() => {
      result.current.openChangeModal(mockMappings[0]);
      result.current.setTargetBucket('pichincha');
    });

    await act(async () => {
      const res = await result.current.applyBucketAssignment();
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Falla al asignar cubeta');
    });
  });

  it('confirmAndSave invoca applyBucketAssignment si no requiere confirmacion adicional', async () => {
    const unconfirmed = [{ id: 2, runfood_forma_pago_id: 102, bucket: 'sin_mapear', confirmado: false }];
    vi.spyOn(cashConfigClient, 'listPaymentMappings').mockResolvedValue({
      ok: true,
      status: 200,
      data: unconfirmed
    });
    vi.spyOn(cashConfigClient, 'assignBucket').mockResolvedValue({
      ok: true,
      status: 200,
      data: { ...unconfirmed[0], bucket: 'pichincha', confirmado: true }
    });

    const { result } = renderHook(() => usePaymentMappings());
    await act(async () => { await Promise.resolve(); });

    act(() => {
      result.current.openChangeModal(unconfirmed[0]);
      result.current.setTargetBucket('pichincha');
    });

    await act(async () => {
      await result.current.confirmAndSave();
    });

    expect(result.current.selectedMapping).toBeNull();
  });
});
