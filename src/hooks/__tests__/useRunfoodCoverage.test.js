import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRunfoodCoverage } from '../useRunfoodCoverage';
import * as client from '../../services/runfoodCatalogClient';

describe('useRunfoodCoverage hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('inicializa y carga cobertura de ventas para 7 días por defecto', async () => {
    const mockCoverage = {
      dias_analizados: 7,
      receta_completa: { porcentaje: '80.00' }
    };
    vi.spyOn(client, 'getRunfoodCoverage').mockResolvedValueOnce({ ok: true, data: mockCoverage });

    const { result } = renderHook(() => useRunfoodCoverage());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockCoverage);
    expect(result.current.error).toBeNull();
  });

  it('permite cambiar días y recargar cobertura', async () => {
    const coverageSpy = vi.spyOn(client, 'getRunfoodCoverage').mockResolvedValue({
      ok: true,
      data: { dias_analizados: 14 }
    });

    const { result } = renderHook(() => useRunfoodCoverage());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setDays(14);
    });

    await waitFor(() => {
      expect(coverageSpy).toHaveBeenCalledWith({ days: 14 });
    });
  });

  it('maneja errores del motor al cargar cobertura', async () => {
    vi.spyOn(client, 'getRunfoodCoverage').mockResolvedValueOnce({
      ok: false,
      error: 'Error de servidor'
    });

    const { result } = renderHook(() => useRunfoodCoverage());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Error de servidor');
  });
});
