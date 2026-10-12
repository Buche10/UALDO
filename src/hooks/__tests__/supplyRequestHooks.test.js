import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { addCatalogItem, addFreeItem, mapItemErrors, removeItem, toPayloadItems, updateItem } from '../supplyRequestItems';
import { useShoppingList, useSupplyRequestActions, useSupplyRequestDetail, useSupplyRequestForm } from '../useSupplyRequests';
import * as client from '../../services/supplyRequestsClient';
import { pendingRequest, shoppingList } from './supplyRequestFixtures';

describe('supplyRequestItems', () => {
  it('adds catalog items once and free items with their own key, and builds the payload', () => {
    let items = addCatalogItem([], { id: 42, name: 'Aceite Vegetal', unit: 'litro' });
    items = addCatalogItem(items, { id: 42, name: 'Aceite Vegetal', unit: 'litro' });
    items = addCatalogItem(items, null);
    items = addFreeItem(items, 1);
    expect(items.map((i) => i.key)).toEqual(['cat:42', 'free:1']);

    items = updateItem(items, 'cat:42', 'quantity', '5');
    items = updateItem(items, 'free:1', 'name', 'Esponjas');
    items = updateItem(items, 'free:1', 'quantity', '10');
    expect(toPayloadItems(items)).toEqual([
      { inventory_item_id: 42, quantity: '5', note: '' },
      { free_text_name: 'Esponjas', unit: 'unidad', quantity: '10', note: '' },
    ]);
    expect(removeItem(items, 'cat:42').map((i) => i.key)).toEqual(['free:1']);
  });

  it('maps engine errors to the item sent at that position', () => {
    const items = addFreeItem(addCatalogItem([], { id: 42, name: 'Aceite' }), 1);
    const mapped = mapItemErrors({
      'items.1.free_text_name': ['Escribe qué necesitas.'],
      'items.1.unit': 'Indica la unidad.',
      'items.0.inventory_item_id': ['El insumo no existe.'],
      'items.7.quantity': ['Sin línea.'],
      note: ['Muy larga.'],
    }, items);
    expect(mapped.byItem['free:1']).toEqual({ name: 'Escribe qué necesitas.', unit: 'Indica la unidad.' });
    expect(mapped.byItem['cat:42']).toEqual({ inventory_item_id: 'El insumo no existe.' });
    expect(mapped.general).toEqual({ items: 'Sin línea.', note: 'Muy larga.' });
  });
});

describe('useSupplyRequestForm', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('reuses the client_uuid after a network error and renews it after a 201', async () => {
    const onCreated = vi.fn();
    const spy = vi.spyOn(client, 'createRequest')
      .mockResolvedValueOnce({ ok: false, status: 0, isNetworkError: true })
      .mockResolvedValueOnce({ ok: true, status: 201, data: { data: pendingRequest } })
      .mockResolvedValueOnce({ ok: true, status: 200, data: { data: pendingRequest } });
    const { result } = renderHook(() => useSupplyRequestForm({ onCreated }));
    act(() => { result.current.addCatalog({ id: 42, name: 'Aceite', unit: 'litro' }); result.current.setPriority('urgent'); result.current.setNote('Noche'); });

    await act(async () => { await result.current.submit(); });
    expect(result.current.error).toContain('Sin conexión');
    await act(async () => { await result.current.submit(); });
    await act(async () => { await result.current.submit(); });

    const uuids = spy.mock.calls.map((call) => call[1]);
    expect(uuids[1]).toBe(uuids[0]);
    expect(uuids[2]).not.toBe(uuids[0]);
    expect(spy.mock.calls[0][0]).toEqual({ priority: 'urgent', note: 'Noche', items: [{ inventory_item_id: 42, quantity: '', note: '' }] });
    expect(onCreated).toHaveBeenNthCalledWith(1, pendingRequest, false);
    expect(onCreated).toHaveBeenNthCalledWith(2, pendingRequest, true);
  });

  it('puts 422 errors next to each item and clears an item error when edited', async () => {
    vi.spyOn(client, 'createRequest').mockResolvedValue({ ok: false, status: 422, data: { message: 'Datos inválidos.', errors: { 'items.0.free_text_name': ['Escribe qué necesitas.'], items: ['Agrega al menos un insumo.'] } } });
    const { result } = renderHook(() => useSupplyRequestForm({ onCreated: vi.fn() }));
    let key;
    act(() => { key = result.current.addFree(); });
    expect(key).toBe('free:1');
    await act(async () => { await result.current.submit(); });

    expect(result.current.itemErrors['free:1'].name).toBe('Escribe qué necesitas.');
    expect(result.current.errors.items).toBe('Agrega al menos un insumo.');
    act(() => { result.current.change('free:1', 'name', 'Esponjas'); });
    expect(result.current.itemErrors['free:1'].name).toBeUndefined();
    act(() => { result.current.change('free:1', 'unit', 'paquete'); });
    act(() => { result.current.remove('free:1'); });
    expect(result.current.items).toEqual([]);
  });
});

describe('useSupplyRequestDetail and useSupplyRequestActions', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('explains a 403 and retries', async () => {
    vi.spyOn(client, 'getRequest')
      .mockResolvedValueOnce({ ok: false, status: 403 })
      .mockResolvedValueOnce({ ok: false, status: 0, error: 'Sin conexión' })
      .mockResolvedValueOnce({ ok: true, data: { data: pendingRequest } });
    const { result } = renderHook(() => useSupplyRequestDetail(101));
    await waitFor(() => expect(result.current.error).toBe('Solo el dueño o quien hizo el pedido pueden verlo.'));
    await act(async () => { await result.current.reload(); });
    expect(result.current.error).toBe('Sin conexión');
    await act(async () => { await result.current.reload(); });
    expect(result.current.request).toEqual(pendingRequest);
  });

  it('runs each action, reports the reason error and reloads after a 409', async () => {
    const onUpdated = vi.fn();
    const onStale = vi.fn();
    vi.spyOn(client, 'decideRequest')
      .mockResolvedValueOnce({ ok: false, status: 422, data: { errors: { note: ['Indica el motivo del rechazo.'] } } })
      .mockResolvedValueOnce({ ok: true, data: { data: { ...pendingRequest, status: 'rejected' } } });
    vi.spyOn(client, 'markPurchased').mockResolvedValue({ ok: false, status: 409, data: { message: "No es posible cambiar el estado del pedido de 'pending' a 'purchased'." } });
    vi.spyOn(client, 'markReceived').mockResolvedValue({ ok: false, status: 409, data: {} });
    vi.spyOn(client, 'cancelRequest').mockResolvedValue({ ok: false, status: 500 });
    const { result } = renderHook(() => useSupplyRequestActions({ requestId: 101, onUpdated, onStale }));

    await act(async () => { await result.current.run('reject', ''); });
    expect(result.current.error).toBe('Indica el motivo del rechazo.');
    await act(async () => { await result.current.run('reject', 'Hay stock'); });
    expect(client.decideRequest).toHaveBeenLastCalledWith(101, 'rejected', 'Hay stock');
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ status: 'rejected' }), 'reject');

    await act(async () => { await result.current.run('purchased'); });
    expect(result.current.error).toContain("de 'pending' a 'purchased'");
    expect(onStale).toHaveBeenCalledTimes(1);
    await act(async () => { await result.current.run('received'); });
    expect(result.current.error).toBe('El pedido cambió de estado: se cargó el estado actual.');
    await act(async () => { await result.current.run('cancel'); });
    expect(result.current.error).toBe('No se pudo completar la acción.');
    act(() => { result.current.clearError(); });
    expect(result.current.error).toBeNull();
  });

  it('approves with an optional note and ignores a second action while one is running', async () => {
    let resolve;
    const spy = vi.spyOn(client, 'decideRequest').mockImplementation(() => new Promise((r) => { resolve = r; }));
    const { result } = renderHook(() => useSupplyRequestActions({ requestId: 101 }));
    let first;
    act(() => { first = result.current.run('approve', ''); });
    await act(async () => { await result.current.run('approve', ''); });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(101, 'approved', '');
    await act(async () => { resolve({ ok: true, data: {} }); await first; });
  });

  it('loads the shopping list and reports errors', async () => {
    vi.spyOn(client, 'getShoppingList')
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, data: { data: shoppingList } });
    const { result } = renderHook(() => useShoppingList());
    await waitFor(() => expect(result.current.error).toBe('No se pudo cargar la lista de compras.'));
    await act(async () => { await result.current.reload(); });
    expect(result.current.items).toEqual(shoppingList);
  });
});
