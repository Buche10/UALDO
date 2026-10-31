import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  buildRequestBody,
  cancelRequest,
  createRequest,
  decideRequest,
  getPurchasingOverview,
  getRequest,
  getShoppingList,
  listRequests,
  markPurchased,
  markReceived,
  normalizeRequestQuantity,
} from '../supplyRequestsClient';

describe('supplyRequestsClient', () => {
  let spy;

  beforeEach(() => {
    vi.restoreAllMocks();
    spy = vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, status: 200, data: {} });
  });

  it('normalizes quantities: comma, positive, up to 100000 and 3 decimals', () => {
    expect(normalizeRequestQuantity(' 2,5 ')).toBe('2.5');
    expect(normalizeRequestQuantity('100000')).toBe('100000');
    ['0', '100000.001', '1.2345', '-1', 'abc', '', null].forEach((value) => expect(normalizeRequestQuantity(value)).toBeNull());
  });

  it('lists with valid filters only and gets purchasing overview', async () => {
    await listRequests();
    expect(spy).toHaveBeenLastCalledWith('/supply-requests');
    await listRequests({ status: 'pending', mine: true, page: 2 });
    expect(spy).toHaveBeenLastCalledWith('/supply-requests?status=pending&mine=1&page=2');
    await listRequests({ status: 'otro', page: 1 });
    expect(spy).toHaveBeenLastCalledWith('/supply-requests');
    await getShoppingList();
    expect(spy).toHaveBeenLastCalledWith('/supply-requests/shopping-list');
    await getPurchasingOverview();
    expect(spy).toHaveBeenLastCalledWith('/supply-requests/shopping-list?overview=1');
  });

  it('creates a request with catalog and free text items and the client uuid', async () => {
    await createRequest({
      priority: 'urgent',
      note: ' Para el fin de semana ',
      items: [
        { inventory_item_id: 42, quantity: '5', note: ' Bidones ' },
        { free_text_name: ' Esponjas verdes ', unit: ' unidad ', quantity: '10,5' },
      ],
    }, 'uuid-1');
    expect(spy).toHaveBeenCalledWith('/supply-requests', {
      method: 'POST',
      body: {
        priority: 'urgent',
        note: 'Para el fin de semana',
        client_uuid: 'uuid-1',
        items: [
          { inventory_item_id: 42, quantity: '5', note: 'Bidones' },
          { free_text_name: 'Esponjas verdes', unit: 'unidad', quantity: '10.5' },
        ],
      },
    });
  });

  it('omite la cantidad si está vacía (Brief 26p) y nunca envía 0', async () => {
    const res = buildRequestBody({
      priority: 'normal',
      items: [
        { inventory_item_id: 15, quantity: '' },
        { free_text_name: 'Tomates', unit: 'kg', quantity: null },
      ],
    });
    expect(Object.keys(res.errors)).toHaveLength(0);
    expect(res.body.items).toEqual([
      { inventory_item_id: 15 },
      { free_text_name: 'Tomates', unit: 'kg' },
    ]);
  });

  it('reports errors with the engine keys and does not call it', async () => {
    const res = await createRequest({
      priority: 'otra',
      note: 'x'.repeat(501),
      items: [
        { inventory_item_id: 42, quantity: '0' },
        { free_text_name: '', unit: '', quantity: '1' },
        { free_text_name: 'Pan', unit: 'x'.repeat(21), quantity: '1', note: 'y'.repeat(201) },
      ],
    }, 'uuid');
    expect(res.status).toBe(422);
    expect(Object.keys(res.data.errors).sort()).toEqual([
      'items.0.quantity', 'items.1.free_text_name', 'items.1.unit', 'items.2.note', 'items.2.unit', 'note',
    ]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('requires between 1 and 30 items and defaults the priority to normal', () => {
    expect(buildRequestBody({ items: [] }).errors.items).toBeDefined();
    expect(buildRequestBody({}).errors.items).toBeDefined();
    const many = Array.from({ length: 31 }, (_, i) => ({ inventory_item_id: i + 1, quantity: '1' }));
    expect(buildRequestBody({ items: many }).errors.items[0]).toContain('30');
    expect(buildRequestBody({ items: [{ inventory_item_id: 1, quantity: '1' }] }).body.priority).toBe('normal');
  });

  it('decides with a required reason to reject and accepts optional items with quantity', async () => {
    expect((await decideRequest(9, 'rejected', '  ')).data.errors.note).toBeDefined();
    expect((await decideRequest(9, 'otra', 'x')).status).toBe(422);
    expect((await decideRequest(9, 'approved', 'x'.repeat(501))).status).toBe(422);
    expect((await decideRequest('9x', 'approved')).status).toBe(400);
    expect(spy).not.toHaveBeenCalled();

    await decideRequest(9, 'approved');
    expect(spy).toHaveBeenLastCalledWith('/supply-requests/9/decision', { method: 'POST', body: { decision: 'approved' } });
    await decideRequest(9, 'rejected', ' Ya hay stock ');
    expect(spy).toHaveBeenLastCalledWith('/supply-requests/9/decision', { method: 'POST', body: { decision: 'rejected', note: 'Ya hay stock' } });

    // Con items fijados en aprobacion (Brief 26p)
    await decideRequest(9, 'approved', null, [{ id: 101, quantity: '3,5' }]);
    expect(spy).toHaveBeenLastCalledWith('/supply-requests/9/decision', {
      method: 'POST',
      body: {
        decision: 'approved',
        items: [{ id: 101, quantity: '3.5' }],
      },
    });
  });

  it('runs the transitions with validated ids', async () => {
    await getRequest(9);
    expect(spy).toHaveBeenLastCalledWith('/supply-requests/9');
    await markPurchased(9);
    expect(spy).toHaveBeenLastCalledWith('/supply-requests/9/purchased', { method: 'POST' });
    await markReceived(9);
    expect(spy).toHaveBeenLastCalledWith('/supply-requests/9/received', { method: 'POST' });
    await cancelRequest('9');
    expect(spy).toHaveBeenLastCalledWith('/supply-requests/9/cancel', { method: 'POST' });

    spy.mockClear();
    for (const fn of [getRequest, markPurchased, markReceived, cancelRequest]) {
      expect((await fn('1e2')).status).toBe(400);
    }
    expect(spy).not.toHaveBeenCalled();
  });
});
