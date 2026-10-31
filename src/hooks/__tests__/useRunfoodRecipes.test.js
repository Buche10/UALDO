import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRunfoodRecipes } from '../useRunfoodRecipes';
import * as client from '../../services/runfoodCatalogClient';

describe('useRunfoodRecipes hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('inicializa y carga recetas sin consultar cobertura', async () => {
    const mockRecipes = {
      data: [{ id: 1, codigo: 'R01', descripcion: 'Lomo plancha', estado: 'completa' }],
      meta: { current_page: 1, last_page: 1, total: 1 }
    };

    const coverageSpy = vi.spyOn(client, 'getRunfoodCoverage');
    vi.spyOn(client, 'listRunfoodRecipes').mockResolvedValueOnce({ ok: true, data: mockRecipes });

    const { result } = renderHook(() => useRunfoodRecipes());

    await waitFor(() => {
      expect(result.current.recipes.loading).toBe(false);
    });

    expect(result.current.recipes.items).toHaveLength(1);
    expect(result.current.recipes.items[0].codigo).toBe('R01');
    expect(coverageSpy).not.toHaveBeenCalled();
  });

  it('permite cambiar estado y búsqueda de recetas con debounce', async () => {
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
});
