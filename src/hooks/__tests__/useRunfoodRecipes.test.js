import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRunfoodRecipes } from '../useRunfoodRecipes';
import * as client from '../../services/runfoodCatalogClient';

describe('useRunfoodRecipes hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('inicializa y carga recetas y cobertura en paralelo', async () => {
    const mockCoverage = {
      dias_analizados: 7,
      receta_completa: { porcentaje: '80.00' }
    };
    const mockRecipes = {
      data: [{ id: 1, codigo: 'R01', descripcion: 'Lomo plancha', estado: 'completa' }],
      meta: { current_page: 1, last_page: 1, total: 1 }
    };

    vi.spyOn(client, 'getRunfoodCoverage').mockResolvedValueOnce({ ok: true, data: mockCoverage });
    vi.spyOn(client, 'listRunfoodRecipes').mockResolvedValueOnce({ ok: true, data: mockRecipes });

    const { result } = renderHook(() => useRunfoodRecipes());

    await waitFor(() => {
      expect(result.current.coverage.loading).toBe(false);
      expect(result.current.recipes.loading).toBe(false);
    });

    expect(result.current.coverage.data).toEqual(mockCoverage);
    expect(result.current.recipes.items).toHaveLength(1);
    expect(result.current.recipes.items[0].codigo).toBe('R01');
  });

  it('permite cambiar estado y busqueda de recetas con debounce', async () => {
    vi.spyOn(client, 'getRunfoodCoverage').mockResolvedValue({ ok: true, data: {} });
    vi.spyOn(client, 'listRunfoodRecipes').mockResolvedValue({
      ok: true,
      data: { data: [], meta: { current_page: 1, last_page: 1 } }
    });

    const { result } = renderHook(() => useRunfoodRecipes());

    act(() => {
      result.current.setEstado('incompleta');
    });

    await waitFor(() => {
      expect(client.listRunfoodRecipes).toHaveBeenCalledWith(expect.objectContaining({ estado: 'incompleta' }));
    });

    act(() => {
      result.current.setSearch('plancha');
    });

    await waitFor(() => {
      expect(client.listRunfoodRecipes).toHaveBeenCalledWith(expect.objectContaining({ search: 'plancha' }));
    }, { timeout: 1000 });
  });

  it('permite cambiar days y recargar cobertura', async () => {
    vi.spyOn(client, 'listRunfoodRecipes').mockResolvedValue({ ok: true, data: { data: [], meta: {} } });
    const coverageSpy = vi.spyOn(client, 'getRunfoodCoverage').mockResolvedValue({ ok: true, data: { dias_analizados: 14 } });

    const { result } = renderHook(() => useRunfoodRecipes());

    act(() => {
      result.current.setDays(14);
    });

    await waitFor(() => {
      expect(coverageSpy).toHaveBeenCalledWith({ days: 14 });
    });
  });
});
