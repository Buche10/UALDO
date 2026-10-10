import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { addItem, linesFromPurchase, mapLineErrors, removeLine, toPayloadLines, updateLine } from '../purchaseLines';
import { usePagedList } from '../usePagedList';
import { usePurchaseForm, todayIso } from '../usePurchaseForm';
import { usePurchaseActions } from '../usePurchaseActions';
import { useDebouncedValue, useItemSearch, useSupplierSave, useValuation } from '../usePurchasesData';
import * as purchasesClient from '../../services/purchasesClient';
import * as inventoryClient from '../../services/inventoryClient';
import { draftPurchase, inventoryItems, pageOf } from './purchaseFixtures';

describe('purchaseLines', () => {
  it('adds each item once, updates, removes and builds the payload without summing', () => {
    let lines = addItem([], { id: 31, name: 'Lomo fino', unit: 'kg' });
    lines = addItem(lines, { id: 31, name: 'Lomo fino', unit: 'kg' });
    lines = addItem(lines, null);
    expect(lines).toHaveLength(1);
    lines = updateLine(lines, 'line:31', 'quantity', '5,5');
    lines = updateLine(lines, 'line:31', 'line_total', '80');
    expect(toPayloadLines(lines)).toEqual([{ item_id: 31, quantity: '5,5', line_total: '80', note: '' }]);
    expect(removeLine(lines, 'line:31')).toEqual([]);
  });

  it('loads the lines of a purchase from the engine', () => {
    const lines = linesFromPurchase(draftPurchase);
    expect(lines[1]).toEqual({ key: 'line:47', item: { id: 47, name: 'Arroz', unit: 'kg' }, quantity: '10.5', line_total: '12.6', note: 'Saco' });
    expect(linesFromPurchase({ lines: [{ item_id: 1, quantity: null, line_total: null }] })[0]).toEqual(expect.objectContaining({ quantity: '', line_total: '', note: '' }));
    expect(linesFromPurchase(null)).toEqual([]);
  });

  it('maps engine errors to the line sent at that position', () => {
    const lines = linesFromPurchase(draftPurchase);
    const mapped = mapLineErrors({
      'lines.1.quantity': ['Cantidad inválida.'],
      'lines.1.line_total': 'Monto inválido.',
      'lines.7.item_id': ['Sin línea.'],
      invoice_number: ['Esa factura ya está registrada.'],
    }, lines);
    expect(mapped.byLine['line:47']).toEqual({ quantity: 'Cantidad inválida.', line_total: 'Monto inválido.' });
    expect(mapped.general).toEqual({ lines: 'Sin línea.', invoice_number: 'Esa factura ya está registrada.' });
  });
});

describe('usePagedList', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('a new first page replaces a load in progress and the old answer is discarded', async () => {
    let resolveOld;
    const oldFetch = vi.fn(() => new Promise((resolve) => { resolveOld = resolve; }));
    const newFetch = vi.fn(async () => pageOf([{ id: 2 }]));
    const { result, rerender } = renderHook(({ fetch }) => usePagedList(fetch, { errorMessage: 'x' }), { initialProps: { fetch: oldFetch } });

    rerender({ fetch: newFetch });
    await waitFor(() => expect(result.current.items).toEqual([{ id: 2 }]));
    await act(async () => { resolveOld(pageOf([{ id: 1 }])); });
    expect(result.current.items).toEqual([{ id: 2 }]);
  });

  it('loads more without duplicates, ignores a second load more and upserts', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(pageOf([{ id: 1 }], 1, 2))
      .mockResolvedValueOnce(pageOf([{ id: 1 }, { id: 2 }], 2, 2));
    const { result } = renderHook(() => usePagedList(fetch, { errorMessage: 'x' }));
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    await act(async () => {
      const first = result.current.loadMore();
      result.current.loadMore();
      await first;
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result.current.items.map((i) => i.id)).toEqual([1, 2]);

    act(() => { result.current.upsert({ id: 2, name: 'nuevo' }); });
    act(() => { result.current.upsert({ id: 3 }); });
    act(() => { result.current.upsert(null); });
    expect(result.current.items.map((i) => i.id)).toEqual([3, 1, 2]);
  });

  it('uses the default message on errors', async () => {
    const failing = async () => ({ ok: false });
    const { result } = renderHook(() => usePagedList(failing, { errorMessage: 'No se pudo.' }));
    await waitFor(() => expect(result.current.error).toBe('No se pudo.'));
  });
});

describe('usePurchaseForm', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('formats today as AAAA-MM-DD', () => {
    expect(todayIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('reuses the client_uuid after a network error and renews it after a 201', async () => {
    const onCreated = vi.fn();
    const spy = vi.spyOn(purchasesClient, 'createPurchase')
      .mockResolvedValueOnce({ ok: false, status: 0, isNetworkError: true })
      .mockResolvedValueOnce({ ok: true, status: 201, data: { data: draftPurchase } })
      .mockResolvedValueOnce({ ok: true, status: 200, data: { data: draftPurchase } });
    const { result } = renderHook(() => usePurchaseForm({ onCreated }));
    act(() => { result.current.setField('supplierId', '4'); result.current.onAddItem({ id: 31, name: 'Lomo fino', unit: 'kg' }); });

    await act(async () => { await result.current.submit(); });
    expect(result.current.error).toContain('Sin conexión');
    await act(async () => { await result.current.submit(); });
    await act(async () => { await result.current.submit(); });

    const uuids = spy.mock.calls.map((call) => call[1]);
    expect(uuids[1]).toBe(uuids[0]);
    expect(uuids[2]).not.toBe(uuids[0]);
    expect(onCreated).toHaveBeenNthCalledWith(1, draftPurchase, false);
    expect(onCreated).toHaveBeenNthCalledWith(2, draftPurchase, true);
    expect(spy.mock.calls[0][0]).toEqual(expect.objectContaining({ supplierId: '4', location: 'warehouse', lines: [{ item_id: 31, quantity: '', line_total: '', note: '' }] }));
  });

  it('puts 422 errors next to each line or field and clears a line error when edited', async () => {
    vi.spyOn(purchasesClient, 'createPurchase').mockResolvedValue({
      ok: false, status: 422, data: { message: 'Datos inválidos.', errors: { 'lines.0.quantity': ['Cantidad inválida.'], invoice_number: ['Esa factura ya está registrada.'] } },
    });
    const { result } = renderHook(() => usePurchaseForm({ onCreated: vi.fn() }));
    act(() => { result.current.onAddItem({ id: 31, name: 'Lomo fino', unit: 'kg' }); });
    await act(async () => { await result.current.submit(); });

    expect(result.current.error).toBe('Datos inválidos.');
    expect(result.current.errors.invoice_number).toBe('Esa factura ya está registrada.');
    expect(result.current.lineErrors['line:31'].quantity).toBe('Cantidad inválida.');
    act(() => { result.current.onChange('line:31', 'quantity', '5'); });
    expect(result.current.lineErrors['line:31'].quantity).toBeUndefined();
    act(() => { result.current.onChange('line:31', 'note', 'x'); });
    act(() => { result.current.onRemove('line:31'); });
    expect(result.current.lines).toEqual([]);
  });
});

describe('usePurchaseActions', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('receives and cancels, explaining a 409', async () => {
    const onUpdated = vi.fn();
    vi.spyOn(purchasesClient, 'receivePurchase').mockResolvedValue({ ok: true, data: { data: { ...draftPurchase, status: 'received' } } });
    vi.spyOn(purchasesClient, 'cancelPurchase')
      .mockResolvedValueOnce({ ok: false, status: 409, data: {} })
      .mockResolvedValueOnce({ ok: false, status: 500, error: 'Error 500' });
    const { result } = renderHook(() => usePurchaseActions({ purchaseId: 9, onUpdated }));

    await act(async () => { await result.current.receive(); });
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ status: 'received' }), 'receive');
    await act(async () => { await result.current.cancel(); });
    expect(result.current.error).toBe('La compra ya estaba recibida o cancelada: no se puede cambiar.');
    await act(async () => { await result.current.cancel(); });
    expect(result.current.error).toBe('Error 500');
    act(() => { result.current.clearError(); });
    expect(result.current.error).toBeNull();
  });

  it('saves lines and returns line errors from the engine', async () => {
    vi.spyOn(purchasesClient, 'replacePurchaseLines')
      .mockResolvedValueOnce({ ok: false, status: 422, data: { errors: { 'lines.0.line_total': ['Monto inválido.'] } } })
      .mockResolvedValueOnce({ ok: true, data: { data: draftPurchase } });
    const { result } = renderHook(() => usePurchaseActions({ purchaseId: 9 }));
    const lines = linesFromPurchase(draftPurchase);

    let outcome;
    await act(async () => { outcome = await result.current.saveLines(lines); });
    expect(outcome).toEqual({ ok: false, lineErrors: { 'line:31': { line_total: 'Monto inválido.' } } });
    await act(async () => { outcome = await result.current.saveLines(lines); });
    expect(outcome).toEqual({ ok: true, lineErrors: {} });
  });

  it('ignores a second action while one is running', async () => {
    let resolve;
    const spy = vi.spyOn(purchasesClient, 'receivePurchase').mockImplementation(() => new Promise((r) => { resolve = r; }));
    const { result } = renderHook(() => usePurchaseActions({ purchaseId: 9 }));
    let first;
    act(() => { first = result.current.receive(); });
    await act(async () => { await result.current.receive(); });
    expect(spy).toHaveBeenCalledTimes(1);
    await act(async () => { resolve({ ok: true, data: {} }); await first; });
  });
});

describe('usePurchasesData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('searches active non-service items after 300 ms and at least 2 letters', async () => {
    const spy = vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({ ok: true, data: { items: inventoryItems } });
    const { result, rerender } = renderHook(({ term }) => useItemSearch(term), { initialProps: { term: 'l' } });
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(spy).not.toHaveBeenCalled();

    rerender({ term: 'lo' });
    await act(async () => { vi.advanceTimersByTime(299); });
    expect(spy).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(spy).toHaveBeenCalledWith({ search: 'lo' });
    expect(result.current.results.map((i) => i.id)).toEqual([31]);
  });

  it('discards a search answer for an older term', async () => {
    let resolveOld;
    vi.spyOn(inventoryClient, 'listInventory')
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
      .mockResolvedValue({ ok: false });
    const { result, rerender } = renderHook(({ term }) => useItemSearch(term), { initialProps: { term: 'lom' } });
    await act(async () => { vi.advanceTimersByTime(300); });
    rerender({ term: 'arr' });
    await act(async () => { resolveOld({ ok: true, data: { items: inventoryItems } }); });
    expect(result.current.results).toEqual([]);
    await act(async () => { vi.advanceTimersByTime(300); });
    expect(result.current.results).toEqual([]);
  });

  it('debounces a value', async () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v), { initialProps: { v: 'a' } });
    rerender({ v: 'ab' });
    expect(result.current).toBe('a');
    await act(async () => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('ab');
  });
});

describe('useSupplierSave and useValuation', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('creates or updates and keeps 422 errors by field', async () => {
    const onSaved = vi.fn();
    vi.spyOn(purchasesClient, 'createSupplier').mockResolvedValue({ ok: false, status: 422, data: { message: 'Datos inválidos.', errors: { name: ['Ya existe un proveedor con ese nombre.'] } } });
    vi.spyOn(purchasesClient, 'updateSupplier').mockResolvedValue({ ok: true, data: { data: { id: 4 } } });
    const { result } = renderHook(() => useSupplierSave({ onSaved }));

    await act(async () => { await result.current.save(null, { name: 'Carnes' }); });
    expect(result.current.errors.name).toBe('Ya existe un proveedor con ese nombre.');
    await act(async () => { await result.current.save(4, { is_active: false }); });
    expect(onSaved).toHaveBeenCalledWith({ id: 4 });
    expect(result.current.errors).toEqual({});
  });

  it('loads the valuation and reports errors', async () => {
    vi.spyOn(purchasesClient, 'getValuation')
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, data: { total: 87.6 } });
    const { result } = renderHook(() => useValuation());
    await waitFor(() => expect(result.current.error).toBe('No se pudo calcular el valor del inventario.'));
    await act(async () => { await result.current.reload(); });
    expect(result.current.valuation).toEqual({ total: 87.6 });
  });
});
