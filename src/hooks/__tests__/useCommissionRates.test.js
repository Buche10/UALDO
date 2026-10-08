import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCommissionRates } from '../useCommissionRates';
import * as cashConfigClient from '../../services/cashConfigClient';

describe('useCommissionRates hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockRates = {
    current: [
      { card_type: 'credito', label: 'Crédito', rate_bp: 448, retention_bp: 200, effective_from: '2026-10-01' }
    ],
    history: []
  };

  it('valida campos incorrectos antes de confirmar', async () => {
    vi.spyOn(cashConfigClient, 'getCommissionRates').mockResolvedValue({
      ok: true,
      status: 200,
      data: mockRates
    });

    const { result } = renderHook(() => useCommissionRates());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.openNewRateModal(mockRates.current[0]);
    });

    // Sin valores debe dar errores en los campos
    act(() => {
      result.current.setRatePercent('');
      result.current.setRetentionPercent('');
      result.current.setEffectiveFrom('');
    });

    act(() => {
      result.current.proceedToConfirm();
    });

    expect(result.current.confirmModal).toBe(false);
    expect(result.current.fieldErrors.rate).toBeDefined();
    expect(result.current.fieldErrors.retention).toBeDefined();
    expect(result.current.fieldErrors.effective_from).toBeDefined();
  });

  it('permite abrir y cerrar modal de historial', async () => {
    vi.spyOn(cashConfigClient, 'getCommissionRates').mockResolvedValue({
      ok: true,
      status: 200,
      data: mockRates
    });

    const { result } = renderHook(() => useCommissionRates());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.openHistoryModal(mockRates.current[0]);
    });
    expect(result.current.historyCard).toEqual(mockRates.current[0]);

    act(() => {
      result.current.closeHistoryModal();
    });
    expect(result.current.historyCard).toBeNull();
  });

  it('maneja error al cargar tasas en fetchRates', async () => {
    vi.spyOn(cashConfigClient, 'getCommissionRates').mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Error de servidor'
    });

    const { result } = renderHook(() => useCommissionRates());

    await act(async () => {
      await result.current.fetchRates();
    });

    expect(result.current.error).toBe('Error de servidor');
  });
});
