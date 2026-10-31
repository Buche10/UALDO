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

  it('espera 300 ms de debounce en la búsqueda antes de consultar', async () => {
    vi.spyOn(client, 'listRunfoodMappings').mockResolvedValue({
      ok: true,
      data: { data: [], meta: { current_page: 1, last_page: 1 } }
    });

    const { result } = renderHook(() => useRunfoodMappings());

    act(() => {
      result.current.setSearch('lom');
    });

    // Inmediatamente después no ha cambiado el debounced search
    expect(client.listRunfoodMappings).not.toHaveBeenCalledWith(expect.objectContaining({ search: 'lom' }));

    await waitFor(() => {
      expect(client.listRunfoodMappings).toHaveBeenCalledWith(expect.objectContaining({ search: 'lom' }));
    }, { timeout: 1000 });
  });

  it('handleAcceptSuggestion maneja éxito y actualiza la lista', async () => {
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
    // Se removió de pendientes
    expect(result.current.items).toHaveLength(0);
  });

  it('handleAcceptSuggestion maneja error 409 con mensaje específico', async () => {
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

  it('handleAcceptSuggestion maneja error 422 mostrando el mensaje del motor', async () => {
    vi.spyOn(client, 'listRunfoodMappings').mockResolvedValue({
      ok: true,
      data: { data: [{ id: 13 }], meta: {} }
    });

    vi.spyOn(client, 'acceptRunfoodMappingSuggestion').mockResolvedValueOnce({
      ok: false,
      status: 422,
      data: { message: 'El insumo sugerido ya no existe en el catálogo.' }
    });

    const { result } = renderHook(() => useRunfoodMappings());

    await act(async () => {
      const res = await result.current.handleAcceptSuggestion(13);
      expect(res.ok).toBe(false);
    });

    expect(result.current.actionError).toBe('El insumo sugerido ya no existe en el catálogo.');
  });

  it('handleUpdateMapping desde Ignorados quita la fila de Ignorados', async () => {
    vi.spyOn(client, 'listRunfoodMappings').mockResolvedValue({
      ok: true,
      data: { data: [{ id: 50, status: 'ignored' }], meta: {} }
    });

    vi.spyOn(client, 'updateRunfoodMapping').mockResolvedValueOnce({
      ok: true,
      data: { id: 50, status: 'confirmed', factor: '1.000000' }
    });

    const { result } = renderHook(() => useRunfoodMappings({ initialStatus: 'ignored' }));

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    await act(async () => {
      const res = await result.current.handleUpdateMapping(50, { inventory_item_id: 8, factor: '1' });
      expect(res.ok).toBe(true);
    });

    // Como ahora su status es confirmed y la pestaña es ignored, debe removerse de la lista
    expect(result.current.items).toHaveLength(0);
    expect(result.current.successBanner).toBe('Mapeo de ingrediente guardado exitosamente.');
  });

  it('handleUpdateMapping desde Confirmados actualiza la fila en su sitio', async () => {
    vi.spyOn(client, 'listRunfoodMappings').mockResolvedValue({
      ok: true,
      data: { data: [{ id: 55, status: 'confirmed', factor: '1.000000' }], meta: {} }
    });

    vi.spyOn(client, 'updateRunfoodMapping').mockResolvedValueOnce({
      ok: true,
      data: { id: 55, status: 'confirmed', factor: '2.500000' }
    });

    const { result } = renderHook(() => useRunfoodMappings({ initialStatus: 'confirmed' }));

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    await act(async () => {
      const res = await result.current.handleUpdateMapping(55, { inventory_item_id: 8, factor: '2.5' });
      expect(res.ok).toBe(true);
    });

    // Sigue en confirmados pero actualizada
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].factor).toBe('2.500000');
  });

  it('handleUpdateMapping con error 422 deja fieldErrors y mensaje general', async () => {
    vi.spyOn(client, 'listRunfoodMappings').mockResolvedValue({
      ok: true,
      data: { data: [{ id: 60, status: 'pending' }], meta: {} }
    });

    vi.spyOn(client, 'updateRunfoodMapping').mockResolvedValueOnce({
      ok: false,
      status: 422,
      error: 'Error de validación',
      data: {
        message: 'Error de validación',
        errors: {
          factor: ['El factor no puede ser mayor a 100000.'],
          inventory_item_id: ['El insumo seleccionado es inválido.']
        }
      }
    });

    const { result } = renderHook(() => useRunfoodMappings());

    await act(async () => {
      const res = await result.current.handleUpdateMapping(60, { inventory_item_id: 99, factor: '100001' });
      expect(res.ok).toBe(false);
    });

    expect(result.current.fieldErrors).toEqual({
      factor: ['El factor no puede ser mayor a 100000.'],
      inventory_item_id: ['El insumo seleccionado es inválido.']
    });
    expect(result.current.actionError).toBe('Error de validación');
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
