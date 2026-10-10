import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountSheet } from '../useCountSheet';
import * as inventoryClient from '../../services/inventoryClient';
import * as inventoryCountsClient from '../../services/inventoryCountsClient';

describe('useCountSheet hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });

  const mockInventory = {
    items: [
      { id: 1, name: 'Harina', type: 'ingredient', category: { name: 'Secos' } },
      { id: 2, name: 'Azúcar', type: 'ingredient', category: { name: 'Secos' } },
      { id: 3, name: 'Servicio de entrega', type: 'service' }, // Debe ser filtrado
    ],
    meta: { current_page: 1, last_page: 1 },
  };

  const mockCount = {
    id: 10,
    location: 'kitchen',
    status: 'draft',
    lines: [
      { item_id: 1, counted_quantity: '5.5' },
    ],
  };

  it('loads inventory items excluding service types and loads count detail', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: mockInventory,
    });

    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: mockCount },
    });

    const onStatusChange = vi.fn();
    const { result } = renderHook(() =>
      useCountSheet({ countId: 10, onStatusChange })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.items.length).toBe(2);
    expect(result.current.items.some(i => i.type === 'service')).toBe(false);
    expect(result.current.countDetail).toEqual(mockCount);
    expect(onStatusChange).toHaveBeenCalledWith('draft');
    expect(result.current.quantities[1]?.counted_quantity).toBe('5.5');
    expect(result.current.quantities[1]?.isDirty).toBe(false);
    expect(result.current.saveStatus).toBe('saved');
  });

  it('updates line quantity and flags it as dirty', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: mockInventory,
    });

    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: mockCount },
    });

    const { result } = renderHook(() =>
      useCountSheet({ countId: 10 })
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.updateQuantity(2, '12');
    });

    expect(result.current.quantities[2]?.counted_quantity).toBe('12');
    expect(result.current.quantities[2]?.isDirty).toBe(true);
    expect(result.current.saveStatus).toBe('dirty');
  });

  it('saves pending lines to the backend and marks them clean', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: mockInventory,
    });

    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: mockCount },
    });

    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines').mockResolvedValue({
      ok: true,
      data: { status: 'saved' },
    });

    const { result } = renderHook(() =>
      useCountSheet({ countId: 10 })
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.updateQuantity(1, '8,5');
    });

    let success;
    await act(async () => {
      success = await result.current.savePendingLines();
    });

    expect(success).toBe(true);
    expect(saveSpy).toHaveBeenCalledWith(10, [
      { item_id: 1, counted_quantity: '8.5' },
    ]);
    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.quantities[1]?.isDirty).toBe(false);
  });

  it('handles error when saving pending lines fails', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: mockInventory,
    });

    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: mockCount },
    });

    vi.spyOn(inventoryCountsClient, 'saveCountLines').mockResolvedValue({
      ok: false,
      status: 422,
      data: { message: 'Línea inválida', errors: { 1: ['Cantidad errónea'] } },
    });

    const { result } = renderHook(() =>
      useCountSheet({ countId: 10 })
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.updateQuantity(1, '99');
    });

    let success;
    await act(async () => {
      success = await result.current.savePendingLines();
    });

    expect(success).toBe(false);
    expect(result.current.saveStatus).toBe('error');
    expect(result.current.saveErrorMessage).toBe('Línea inválida');
    expect(result.current.lineErrors).toEqual({ 1: ['Cantidad errónea'] });
  });

  it('triggers autosave after 60 seconds of inactivity when tab is visible', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: mockInventory,
    });

    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: mockCount },
    });

    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines').mockResolvedValue({
      ok: true,
      data: { status: 'saved' },
    });

    const { result } = renderHook(() =>
      useCountSheet({ countId: 10 })
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.updateQuantity(1, '14');
    });

    expect(saveSpy).not.toHaveBeenCalled();

    // Advance 60s
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });

    expect(saveSpy).toHaveBeenCalledWith(10, [
      { item_id: 1, counted_quantity: '14' },
    ]);
  });

  it('triggers autosave when 20 lines are modified', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: mockInventory,
    });

    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: mockCount },
    });

    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines').mockResolvedValue({
      ok: true,
      data: { status: 'saved' },
    });

    const { result } = renderHook(() =>
      useCountSheet({ countId: 10 })
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      for (let i = 1; i <= 20; i++) {
        result.current.updateQuantity(i, String(i));
      }
      await Promise.resolve();
    });

    expect(saveSpy).toHaveBeenCalled();
  });

  it('keeps line dirty and sends updated value on next save if edited during in-flight save', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: mockInventory,
    });

    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: mockCount },
    });

    let resolveSave;
    const controlledPromise = new Promise((resolve) => {
      resolveSave = resolve;
    });

    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines')
      .mockImplementationOnce(() => controlledPromise)
      .mockResolvedValueOnce({ ok: true, data: { status: 'saved' } });

    const { result } = renderHook(() =>
      useCountSheet({ countId: 10 })
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Initial edit
    act(() => {
      result.current.updateQuantity(1, '8');
    });

    // Start saving: in-flight
    let savePromise;
    act(() => {
      savePromise = result.current.savePendingLines();
    });

    expect(saveSpy).toHaveBeenCalledWith(10, [{ item_id: 1, counted_quantity: '8' }]);

    // While save is in flight, edit line 1 again
    act(() => {
      result.current.updateQuantity(1, '9');
    });

    // Resolve initial save
    await act(async () => {
      resolveSave({ ok: true, data: { status: 'saved' } });
      await savePromise;
    });

    // It must still be dirty!
    expect(result.current.quantities[1]?.isDirty).toBe(true);
    expect(result.current.saveStatus).toBe('dirty');

    // Next save sends the new value '9'
    let secondSaveSuccess;
    await act(async () => {
      secondSaveSuccess = await result.current.savePendingLines();
    });

    expect(secondSaveSuccess).toBe(true);
    expect(saveSpy).toHaveBeenLastCalledWith(10, [{ item_id: 1, counted_quantity: '9' }]);
    expect(result.current.quantities[1]?.isDirty).toBe(false);
    expect(result.current.saveStatus).toBe('saved');
  });

  it('sends only dirty lines, sends "0" explicitly, and skips blank lines (killing mutation)', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: {
        items: [
          { id: 1, name: 'Harina', type: 'ingredient' },
          { id: 2, name: 'Azúcar', type: 'ingredient' },
          { id: 3, name: 'Sal', type: 'ingredient' },
        ],
        meta: { last_page: 1 },
      },
    });

    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: {
        data: {
          id: 10,
          location: 'kitchen',
          status: 'draft',
          lines: [
            { item_id: 3, counted_quantity: '5' }, // Clean line with 5
          ],
        },
      },
    });

    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines').mockResolvedValue({
      ok: true,
      data: { status: 'saved' },
    });

    const { result } = renderHook(() =>
      useCountSheet({ countId: 10 })
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Item 1 set to '0' (must be sent)
    // Item 2 set to '  ' (blank, must be skipped)
    // Item 3 is untouched (clean, must NOT be sent)
    act(() => {
      result.current.updateQuantity(1, '0');
      result.current.updateQuantity(2, '   ');
    });

    await act(async () => {
      await result.current.savePendingLines();
    });

    // EXACT check: only item 1 with counted_quantity '0' must be sent.
    // If mutation changes if (entry.isDirty) to if (true), item 3 would be sent and this assertion fails!
    expect(saveSpy).toHaveBeenCalledWith(10, [
      { item_id: 1, counted_quantity: '0' },
    ]);
  });

  it('triggers autosave on 20 distinct items modified, not 20 keystrokes on the same item', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: mockInventory,
    });

    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: mockCount },
    });

    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines').mockResolvedValue({
      ok: true,
      data: { status: 'saved' },
    });

    const { result } = renderHook(() =>
      useCountSheet({ countId: 10 })
    );

    await act(async () => {
      await Promise.resolve();
    });

    // 20 edits on the same item: must NOT trigger autosave immediately
    act(() => {
      for (let i = 0; i < 20; i++) {
        result.current.updateQuantity(1, String(i));
      }
    });

    expect(saveSpy).not.toHaveBeenCalled();

    // Now edit 20 distinct items: must trigger autosave immediately
    await act(async () => {
      for (let i = 1; i <= 20; i++) {
        result.current.updateQuantity(i, String(i));
      }
      await Promise.resolve();
    });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy.mock.calls[0][1].length).toBe(20);
  });

  it('queues a save requested during another and sends what was edited meanwhile', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({ ok: true, data: mockInventory });
    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({ ok: true, data: { data: mockCount } });

    let resolveFirst;
    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines')
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce({ ok: true, data: { status: 'saved' } });

    const { result } = renderHook(() => useCountSheet({ countId: 10 }));
    await act(async () => { await Promise.resolve(); });

    act(() => { result.current.updateQuantity(1, '8'); });
    let first;
    act(() => { first = result.current.savePendingLines(); });

    // Durante el guardado se edita otra línea y se pide guardar otra vez.
    act(() => { result.current.updateQuantity(2, '3'); });
    let second;
    act(() => { second = result.current.savePendingLines(); });
    expect(saveSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst({ ok: true, data: { status: 'saved' } });
      await first;
      await second;
    });

    expect(saveSpy).toHaveBeenCalledTimes(2);
    expect(saveSpy).toHaveBeenLastCalledWith(10, [{ item_id: 2, counted_quantity: '3' }]);
    expect(await second).toBe(true);
    expect(result.current.hasPendingChanges()).toBe(false);
    expect(result.current.saveStatus).toBe('saved');
  });

  it('sends valid lines and keeps an invalid one pending with its error', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({ ok: true, data: mockInventory });
    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({ ok: true, data: { data: mockCount } });
    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines').mockResolvedValue({ ok: true, data: { status: 'saved' } });

    const { result } = renderHook(() => useCountSheet({ countId: 10 }));
    await act(async () => { await Promise.resolve(); });

    act(() => {
      result.current.updateQuantity(1, '1.2345');
      result.current.updateQuantity(2, '5');
    });

    let ok;
    await act(async () => { ok = await result.current.savePendingLines(); });

    expect(saveSpy).toHaveBeenCalledWith(10, [{ item_id: 2, counted_quantity: '5' }]);
    expect(ok).toBe(false);
    expect(result.current.lineErrors[1]).toEqual(['Usa solo números, con 3 decimales como máximo.']);
    expect(result.current.quantities[1].isDirty).toBe(true);
    expect(result.current.quantities[2].isDirty).toBe(false);
    expect(result.current.saveStatus).toBe('invalid');
  });

  it('a line is pending only when it differs from what is saved', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({ ok: true, data: mockInventory });
    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({ ok: true, data: { data: mockCount } });
    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines').mockResolvedValue({ ok: true, data: { status: 'saved' } });

    const { result } = renderHook(() => useCountSheet({ countId: 10 }));
    await act(async () => { await Promise.resolve(); });

    // Item 1 tiene 5.5 guardado: escribir lo mismo (con coma) no lo ensucia.
    act(() => { result.current.updateQuantity(1, '5,5'); });
    expect(result.current.quantities[1].isDirty).toBe(false);

    // Dejar en blanco una línea nunca guardada no la ensucia.
    act(() => { result.current.updateQuantity(2, '4'); });
    act(() => { result.current.updateQuantity(2, ''); });
    expect(result.current.quantities[2].isDirty).toBe(false);

    // Dejar en blanco la cantidad guardada no es un pendiente (el motor la conserva).
    act(() => { result.current.updateQuantity(1, ''); });
    expect(result.current.quantities[1].isDirty).toBe(false);
    expect(result.current.hasPendingChanges()).toBe(false);
    expect(result.current.saveStatus).toBe('saved');

    let ok;
    await act(async () => { ok = await result.current.savePendingLines(); });
    expect(ok).toBe(true);
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('saves pending lines when the tab is hidden during a save, after that save ends', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({ ok: true, data: mockInventory });
    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({ ok: true, data: { data: mockCount } });

    let resolveFirst;
    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines')
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce({ ok: true, data: { status: 'saved' } });

    const { result } = renderHook(() => useCountSheet({ countId: 10 }));
    await act(async () => { await Promise.resolve(); });

    act(() => { result.current.updateQuantity(1, '8'); });
    let first;
    act(() => { first = result.current.savePendingLines(); });
    act(() => { result.current.updateQuantity(2, '7'); });

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(saveSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst({ ok: true, data: { status: 'saved' } });
      await first;
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(saveSpy).toHaveBeenCalledTimes(2);
    expect(saveSpy).toHaveBeenLastCalledWith(10, [{ item_id: 2, counted_quantity: '7' }]);
  });

  it('does not start a second save while one is in progress', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: mockInventory,
    });

    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: mockCount },
    });

    let resolveSave;
    const savePromise = new Promise((resolve) => {
      resolveSave = resolve;
    });

    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines').mockImplementation(() => savePromise);

    const { result } = renderHook(() =>
      useCountSheet({ countId: 10 })
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.updateQuantity(1, '10');
    });

    let p1;
    act(() => {
      p1 = result.current.savePendingLines();
    });

    expect(saveSpy).toHaveBeenCalledTimes(1);

    // Pedir guardar otra vez con p1 en curso no abre otra petición: espera.
    let p2;
    act(() => {
      p2 = result.current.savePendingLines();
    });
    expect(saveSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSave({ ok: true, data: { status: 'saved' } });
      await p1;
      await p2;
    });

    // Nada quedó pendiente: el segundo guardado no envió nada.
    expect(await p2).toBe(true);
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('does not autosave on timer if tab is hidden, and saves immediately when tab becomes hidden', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: mockInventory,
    });

    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: mockCount },
    });

    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines').mockResolvedValue({
      ok: true,
      data: { status: 'saved' },
    });

    let visibility = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });

    const { result } = renderHook(() =>
      useCountSheet({ countId: 10 })
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Change to hidden
    visibility = 'hidden';

    act(() => {
      result.current.updateQuantity(1, '25');
    });

    // Advance 60s while hidden: timer must NOT trigger save
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(saveSpy).not.toHaveBeenCalled();

    // Now test transition from visible to hidden saves pending
    visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));

    act(() => {
      result.current.updateQuantity(2, '30');
    });

    // Transition to hidden: visibilitychange fires
    visibility = 'hidden';
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(saveSpy).toHaveBeenCalledWith(10, [
      { item_id: 1, counted_quantity: '25' },
      { item_id: 2, counted_quantity: '30' },
    ]);
  });

  it('handles partial inventory loading failure, shows itemsError, and allows retry', async () => {
    const listSpy = vi.spyOn(inventoryClient, 'listInventory')
      .mockResolvedValueOnce({
        ok: true,
        data: {
          items: [{ id: 1, name: 'Harina', type: 'ingredient' }],
          meta: { current_page: 1, last_page: 2 },
        },
      })
      .mockResolvedValueOnce({
        ok: false,
        error: 'Error en la página 2',
      });

    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: mockCount },
    });

    const { result } = renderHook(() =>
      useCountSheet({ countId: 10 })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.itemsError).toBe('Error en la página 2');

    // Retry should trigger listInventory again
    listSpy.mockReset();
    listSpy.mockResolvedValueOnce({
      ok: true,
      data: {
        items: [{ id: 1, name: 'Harina', type: 'ingredient' }],
        meta: { current_page: 1, last_page: 1 },
      },
    });

    await act(async () => {
      await result.current.retryLoadItems();
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.itemsError).toBeNull();
  });

  it('validates maximum quantity of 1.000.000 and clears error when user enters valid value', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: mockInventory,
    });
    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: mockCount },
    });

    const { result } = renderHook(() => useCountSheet({ countId: 10 }));
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.updateQuantity(1, '1000001');
    });

    expect(result.current.lineErrors[1]).toEqual(['La cantidad no puede superar 1.000.000.']);

    // Update with valid quantity clears the error
    act(() => {
      result.current.updateQuantity(1, '500');
    });

    expect(result.current.lineErrors[1]).toBeUndefined();
  });

  it('reschedules 60s timer when returning to visible with dirty lines and triggers save', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: mockInventory,
    });
    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: mockCount },
    });
    const saveSpy = vi.spyOn(inventoryCountsClient, 'saveCountLines').mockResolvedValue({
      ok: true,
      data: { status: 'saved' },
    });

    let visibility = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });

    const { result } = renderHook(() => useCountSheet({ countId: 10 }));
    await act(async () => {
      await Promise.resolve();
    });

    // Make dirty while visible
    act(() => {
      result.current.updateQuantity(1, '15');
    });

    // Switch to hidden (saves)
    visibility = 'hidden';
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(saveSpy).toHaveBeenCalledTimes(1);

    // Make dirty while hidden
    act(() => {
      result.current.updateQuantity(2, '20');
    });

    // Switch back to visible: should reschedule 60s timer
    visibility = 'visible';
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Advance 60s while visible: should trigger save
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });

    expect(saveSpy).toHaveBeenCalledTimes(2);
  });

  it('handles save failure with status 422 and fallback error message', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: mockInventory,
    });
    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: mockCount },
    });
    vi.spyOn(inventoryCountsClient, 'saveCountLines').mockResolvedValue({
      ok: false,
      status: 422,
      data: {
        message: 'Validación fallida',
        errors: { 1: ['Cantidad inválida'] },
      },
    });

    const { result } = renderHook(() => useCountSheet({ countId: 10 }));
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.updateQuantity(1, '10');
    });

    let saveResult;
    await act(async () => {
      saveResult = await result.current.savePendingLines();
    });

    expect(saveResult).toBe(false);
    expect(result.current.saveStatus).toBe('error');
    expect(result.current.saveErrorMessage).toBe('Validación fallida');
    expect(result.current.lineErrors[1]).toEqual(['Cantidad inválida']);
  });
});
