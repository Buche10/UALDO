import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRunfoodMappings } from '../useRunfoodMappings';
import * as client from '../../services/runfoodCatalogClient';

describe('useRunfoodMappings hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('inicializa en pendientes y carga contadores y lista de mapeos', async () => {
    vi.spyOn(client, 'listRunfoodMappings')
      .mockResolvedValueOnce({ ok: true, data: { meta: { total: 5 } } }) // pending count
      .mockResolvedValueOnce({ ok: true, data: { meta: { total: 10 } } }) // confirmed count
      .mockResolvedValueOnce({ ok: true, data: { meta: { total: 2 } } }) // ignored count
      .mockResolvedValueOnce({
        ok: true,
        data: {
          data: [{ id: 1, runfood_article: { descripcion: 'Carne' }, status: 'pending' }],
          meta: { current_page: 1, last_page: 1, total: 1 }
        }
      });

    const { result } = renderHook(() => useRunfoodMappings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.status).toBe('pending');
    expect(result.current.counts).toEqual({ pending: 5, confirmed: 10, ignored: 2 });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe(1);
  });

  it('espera 300 ms de debounce en la busqueda antes de consultar', async () => {
    vi.spyOn(client, 'listRunfoodMappings').mockResolvedValue({
      ok: true,
      data: { data: [], meta: { current_page: 1, last_page: 1 } }
    });

    const { result } = renderHook(() => useRunfoodMappings());

    act(() => {
      result.current.setSearch('lom');
    });

    // Inmediatamente despues no ha cambiado el debounced search
    expect(client.listRunfoodMappings).not.toHaveBeenCalledWith(expect.objectContaining({ search: 'lom' }));

    await waitFor(() => {
      expect(client.listRunfoodMappings).toHaveBeenCalledWith(expect.objectContaining({ search: 'lom' }));
    }, { timeout: 1000 });
  });

  it('handleAcceptSuggestion maneja exito y actualiza la lista', async () => {
    vi.spyOn(client, 'listRunfoodMappings').mockResolvedValue({
      ok: true,
      data: {
        data: [{ id: 10, runfood_article: { descripcion: 'Pollo' }, status: 'pending' }],
        meta: { current_page: 1, last_page: 1 }
      }
    });

    vi.spyOn(client, 'acceptRunfoodMappingSuggestion').mockResolvedValueOnce({
      ok: true,
      data: { id: 10, status: 'confirmed' }
    });

    const { result } = renderHook(() => useRunfoodMappings());

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    let res;
    await act(async () => {
      res = await result.current.handleAcceptSuggestion(10);
    });

    expect(res.ok).toBe(true);
    expect(result.current.successBanner).toBe('Sugerencia aceptada exitosamente.');
    // Se removio de pendientes
    expect(result.current.items).toHaveLength(0);
  });

  it('handleAcceptSuggestion maneja error 409 con mensaje especifico', async () => {
    vi.spyOn(client, 'listRunfoodMappings').mockResolvedValue({
      ok: true,
      data: { data: [{ id: 12 }], meta: {} }
    });

    vi.spyOn(client, 'acceptRunfoodMappingSuggestion').mockResolvedValueOnce({
      ok: false,
      status: 409,
      error: 'Conflict'
    });

    const { result } = renderHook(() => useRunfoodMappings());

    await act(async () => {
      await result.current.handleAcceptSuggestion(12);
    });

    expect(result.current.actionError).toBe('Este ingrediente ya no tiene sugerencia; elige un insumo');
  });

  it('handleUpdateMapping envia insumo y factor y actualiza', async () => {
    vi.spyOn(client, 'listRunfoodMappings').mockResolvedValue({
      ok: true,
      data: { data: [{ id: 15, status: 'pending' }], meta: {} }
    });

    vi.spyOn(client, 'updateRunfoodMapping').mockResolvedValueOnce({
      ok: true,
      data: { id: 15, status: 'confirmed', factor: '2.000000' }
    });

    const { result } = renderHook(() => useRunfoodMappings());

    await act(async () => {
      const res = await result.current.handleUpdateMapping(15, { inventory_item_id: 30, factor: '2' });
      expect(res.ok).toBe(true);
    });

    expect(result.current.successBanner).toBe('Mapeo de ingrediente guardado exitosamente.');
  });

  it('handleIgnoreMapping y handleReopenMapping ejecutan sus acciones', async () => {
    vi.spyOn(client, 'listRunfoodMappings').mockResolvedValue({
      ok: true,
      data: { data: [{ id: 20 }], meta: {} }
    });
    vi.spyOn(client, 'ignoreRunfoodMapping').mockResolvedValueOnce({ ok: true });
    vi.spyOn(client, 'reopenRunfoodMapping').mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() => useRunfoodMappings());

    await act(async () => {
      const resIgnore = await result.current.handleIgnoreMapping(20);
      expect(resIgnore.ok).toBe(true);
    });
    expect(result.current.successBanner).toBe('Ingrediente ignorado. No se descontará del inventario.');

    await act(async () => {
      const resReopen = await result.current.handleReopenMapping(20);
      expect(resReopen.ok).toBe(true);
    });
    expect(result.current.successBanner).toBe('Ingrediente reabierto a pendiente.');
  });
});
