import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  buildPurchaseLines,
  buildSupplierBody,
  cancelPurchase,
  createPurchase,
  createSupplier,
  getPurchase,
  getValuation,
  listPurchases,
  listSuppliers,
  normalizePurchaseQuantity,
  receivePurchase,
  replacePurchaseLines,
  updateSupplier,
} from '../purchasesClient';

describe('purchasesClient', () => {
  let spy;

  beforeEach(() => {
    vi.restoreAllMocks();
    spy = vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, status: 200, data: {} });
  });

  it('normalizes quantities: comma, positive and 3 decimals', () => {
    expect(normalizePurchaseQuantity(' 10,5 ')).toBe('10.5');
    ['0', '1.2345', '-1', 'abc', '', null].forEach((value) => expect(normalizePurchaseQuantity(value)).toBeNull());
  });

  describe('suppliers', () => {
    it('lists with search, inactive and page through URLSearchParams', async () => {
      await listSuppliers();
      expect(spy).toHaveBeenLastCalledWith('/suppliers');
      await listSuppliers({ search: ' Carnes & Co ', includeInactive: true, page: 2 });
      expect(spy).toHaveBeenLastCalledWith('/suppliers?search=Carnes+%26+Co&include_inactive=1&page=2');
    });

    it('validates name, tax id, phone and email before creating', async () => {
      const res = await createSupplier({ name: ' ', tax_id: '123', phone: 'abc', email: 'no-es-correo' });
      expect(res.status).toBe(422);
      expect(Object.keys(res.data.errors).sort()).toEqual(['email', 'name', 'phone', 'tax_id']);
      expect((await createSupplier({ name: 'x'.repeat(121) })).data.errors.name[0]).toContain('120');
      expect(spy).not.toHaveBeenCalled();

      await createSupplier({ name: ' Carnes del Valle ', tax_id: '1790012345001', phone: '+593 99 123 4567', email: 'ventas@valle.ec', contact_name: ' Ana ', notes: '' });
      expect(spy).toHaveBeenCalledWith('/suppliers', {
        method: 'POST',
        body: { name: 'Carnes del Valle', tax_id: '1790012345001', phone: '+593 99 123 4567', email: 'ventas@valle.ec', contact_name: 'Ana', notes: null },
      });
    });

    it('updates only the fields sent, including is_active', async () => {
      await updateSupplier(4, { is_active: false });
      expect(spy).toHaveBeenLastCalledWith('/suppliers/4', { method: 'PUT', body: { is_active: false } });
      expect(buildSupplierBody({ name: '' }, { partial: true }).errors.name).toBeDefined();
      expect((await updateSupplier('4x', { is_active: true })).status).toBe(400);
      expect((await updateSupplier(4, { email: 'mal' })).status).toBe(422);
    });
  });

  describe('purchases', () => {
    const base = {
      supplierId: 4,
      location: 'warehouse',
      purchasedOn: '2026-10-09',
      invoiceNumber: ' 001-002-000123456 ',
      notes: '',
      lines: [
        { item_id: 31, quantity: '5', line_total: '75,00' },
        { item_id: 47, quantity: '10,5', line_total: '12.6', note: ' Saco ' },
      ],
    };

    it('lists with valid filters only', async () => {
      await listPurchases({ status: 'draft', supplierId: 4, from: '2026-10-01', to: '2026-10-09', page: 2 });
      expect(spy).toHaveBeenLastCalledWith('/purchases?status=draft&supplier_id=4&from=2026-10-01&to=2026-10-09&page=2');
      await listPurchases({ status: 'otro', supplierId: 'x', from: '01/10/2026' });
      expect(spy).toHaveBeenLastCalledWith('/purchases');
    });

    it('creates a draft with text amounts and the client uuid', async () => {
      await createPurchase(base, 'uuid-1');
      expect(spy).toHaveBeenCalledWith('/purchases', {
        method: 'POST',
        body: {
          supplier_id: 4,
          location: 'warehouse',
          purchased_on: '2026-10-09',
          invoice_number: '001-002-000123456',
          client_uuid: 'uuid-1',
          lines: [
            { item_id: 31, quantity: '5', line_total: '75.00' },
            { item_id: 47, quantity: '10.5', line_total: '12.6', note: 'Saco' },
          ],
        },
      });
    });

    it('reports errors with the engine keys and does not call it', async () => {
      const res = await createPurchase({
        ...base,
        supplierId: null,
        location: 'bodega',
        purchasedOn: '09/10/2026',
        lines: [{ item_id: 31, quantity: '0', line_total: '1.234' }, { item_id: 31, quantity: '1', line_total: '1' }],
      }, 'uuid');
      expect(res.status).toBe(422);
      expect(Object.keys(res.data.errors).sort()).toEqual([
        'lines.0.line_total', 'lines.0.quantity', 'lines.1.item_id', 'location', 'purchased_on', 'supplier_id',
      ]);
      expect(spy).not.toHaveBeenCalled();
    });

    it('requires between 1 and 200 lines', () => {
      expect(buildPurchaseLines([]).errors.lines).toBeDefined();
      expect(buildPurchaseLines(null).errors.lines).toBeDefined();
      const many = Array.from({ length: 201 }, (_, i) => ({ item_id: i + 1, quantity: '1', line_total: '1' }));
      expect(buildPurchaseLines(many).errors.lines[0]).toContain('200');
    });

    it('replaces lines, receives and cancels with validated ids', async () => {
      await replacePurchaseLines(9, base.lines);
      expect(spy).toHaveBeenLastCalledWith('/purchases/9/lines', { method: 'PUT', body: { lines: expect.any(Array) } });
      await receivePurchase(9);
      expect(spy).toHaveBeenLastCalledWith('/purchases/9/receive', { method: 'POST' });
      await cancelPurchase('9');
      expect(spy).toHaveBeenLastCalledWith('/purchases/9/cancel', { method: 'POST' });
      await getPurchase(9);
      expect(spy).toHaveBeenLastCalledWith('/purchases/9');
      await getValuation();
      expect(spy).toHaveBeenLastCalledWith('/inventory/valuation');

      spy.mockClear();
      for (const fn of [getPurchase, receivePurchase, cancelPurchase]) {
        expect((await fn('1e2')).status).toBe(400);
      }
      expect((await replacePurchaseLines(0, base.lines)).status).toBe(400);
      expect((await replacePurchaseLines(9, [])).status).toBe(422);
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
