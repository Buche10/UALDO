import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  normalizeQuantity,
  listInventory,
  fetchAlerts,
  fetchMovements,
  registerMovement,
  createItem,
} from '../inventoryClient';

describe('inventoryClient service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('normalizeQuantity', () => {
    it('normalizes valid positive integers and decimals with comma or dot', () => {
      expect(normalizeQuantity('10')).toBe('10');
      expect(normalizeQuantity(10)).toBe('10');
      expect(normalizeQuantity('2,5')).toBe('2.5');
      expect(normalizeQuantity('2.500')).toBe('2.500');
      expect(normalizeQuantity(12.345)).toBe('12.345');
    });

    it('rejects invalid, negative, zero or more than 3 decimal places', () => {
      expect(normalizeQuantity('0')).toBeNull();
      expect(normalizeQuantity('-5')).toBeNull();
      expect(normalizeQuantity('abc')).toBeNull();
      expect(normalizeQuantity('1.2345')).toBeNull();
      expect(normalizeQuantity('')).toBeNull();
      expect(normalizeQuantity(null)).toBeNull();
    });
  });

  describe('listInventory', () => {
    it('sends correct query parameters and encodes filter', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: [] },
      });

      await listInventory({ search: 'harina especial', low_stock: true, page: 2 });

      expect(spy).toHaveBeenCalledTimes(1);
      const url = spy.mock.calls[0][0];
      expect(url).toContain('/inventory?');
      expect(url).toContain('search=harina+especial');
      expect(url).toContain('low_stock=1');
      expect(url).toContain('page=2');
    });

    it('sends include_inactive=1 when includeInactive is true, and omits it when false', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: [] },
      });

      await listInventory({ includeInactive: true });
      expect(spy).toHaveBeenCalledWith('/inventory?include_inactive=1');

      spy.mockClear();
      await listInventory({ includeInactive: false });
      expect(spy).toHaveBeenCalledWith('/inventory');
    });
  });

  describe('fetchAlerts', () => {
    it('calls /inventory/alerts', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: [] },
      });

      await fetchAlerts();
      expect(spy).toHaveBeenCalledWith('/inventory/alerts');
    });
  });

  describe('fetchMovements', () => {
    it('rejects non-integer itemId without making network request', async () => {
      const spy = vi.spyOn(apiClient, 'request');

      const result = await fetchMovements('invalid-id');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('inválido');
      expect(spy).not.toHaveBeenCalled();
    });

    it('makes request for valid integer itemId', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: [] },
      });

      const result = await fetchMovements(42, 3);
      expect(result.ok).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      const url = spy.mock.calls[0][0];
      expect(url).toContain('/inventory/42/movements?page=3');
    });
  });

  describe('registerMovement', () => {
    it('rejects non-integer itemId without making network request', async () => {
      const spy = vi.spyOn(apiClient, 'request');

      const result = await registerMovement('abc', {
        kind: 'salida',
        quantity: '5',
      }, '123e4567-e89b-12d3-a456-426614174000');

      expect(result.ok).toBe(false);
      expect(result.error).toContain('inválido');
      expect(spy).not.toHaveBeenCalled();
    });

    it('rejects invalid quantity without making network request', async () => {
      const spy = vi.spyOn(apiClient, 'request');

      const result = await registerMovement(10, {
        kind: 'salida',
        quantity: '0',
      }, '123e4567-e89b-12d3-a456-426614174000');

      expect(result.ok).toBe(false);
      expect(result.error).toContain('positivo');
      expect(spy).not.toHaveBeenCalled();
    });

    it('sends quantity as string and passes client_uuid on valid call', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 201,
        data: { message: 'Movimiento registrado exitosamente' },
      });

      const clientUuid = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
      const result = await registerMovement(12, {
        kind: 'salida',
        quantity: '2,5',
        reason: 'merma',
        location: 'bodega',
      }, clientUuid);

      expect(result.ok).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      const [path, options] = spy.mock.calls[0];
      expect(path).toBe('/inventory/12/movements');
      expect(options.method).toBe('POST');
      expect(options.body).toEqual({
        kind: 'salida',
        quantity: '2.5',
        reason: 'merma',
        location: 'bodega',
        client_uuid: clientUuid,
      });
      // Verifies quantity is strictly a string
      expect(typeof options.body.quantity).toBe('string');
    });
  });

  describe('createItem', () => {
    it('creates item with normalized numeric strings and handles optional fields', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 201,
        data: { id: 99, name: 'Queso Mozzarella' },
      });

      const res = await createItem({
        name: 'Queso Mozzarella',
        unit: 'kg',
        min_stock: '10,5',
        reorder_point: '25',
        type: 'supply',
        supplier: 'Lacteos SA',
        sku: 'SKU-100',
      });

      expect(res.ok).toBe(true);
      expect(spy).toHaveBeenCalledWith('/inventory/items', {
        method: 'POST',
        body: {
          name: 'Queso Mozzarella',
          unit: 'kg',
          min_stock: '10.5',
          reorder_point: '25',
          type: 'supply',
          supplier: 'Lacteos SA',
          sku: 'SKU-100',
        },
      });
    });

    it('discards invalid min_stock, reorder_point and ignores empty type or sku', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 201,
        data: { id: 100, name: 'Harina' },
      });

      const res = await createItem({
        name: 'Harina',
        unit: 'kg',
        min_stock: '-5',
        reorder_point: 'invalido',
        type: '   ',
        supplier: '',
        sku: '',
      });

      expect(res.ok).toBe(true);
      expect(spy).toHaveBeenCalledWith('/inventory/items', {
        method: 'POST',
        body: {
          name: 'Harina',
          unit: 'kg',
        },
      });
    });
  });

  describe('listInventory edge cases', () => {
    it('ignores non-integer or <=1 page and invalid query filters', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: [] },
      });

      await listInventory({ page: 'no-es-numero', search: '   ' });
      expect(spy).toHaveBeenCalledWith('/inventory');

      await listInventory({ page: 1, low_stock: false });
      expect(spy).toHaveBeenCalledWith('/inventory');
    });
  });
});
