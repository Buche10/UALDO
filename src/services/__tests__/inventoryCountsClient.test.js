import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  listCounts,
  createCount,
  getCount,
  saveCountLines,
  applyCount,
  cancelCount,
} from '../inventoryCountsClient';

describe('inventoryCountsClient service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('listCounts', () => {
    it('requests /inventory/counts when called without filters', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: [], meta: { total: 0 } },
      });

      const res = await listCounts();
      expect(res.ok).toBe(true);
      expect(spy).toHaveBeenCalledWith('/inventory/counts');
    });

    it('builds query string with valid location, status and page', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: [] },
      });

      await listCounts({ location: 'warehouse', status: 'draft', page: 2 });
      expect(spy).toHaveBeenCalledWith('/inventory/counts?location=warehouse&status=draft&page=2');
    });

    it('ignores invalid location and page 1 in query string', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: [] },
      });

      await listCounts({ location: 'bodega', status: 'applied', page: 1 });
      expect(spy).toHaveBeenCalledWith('/inventory/counts?status=applied');
    });

    it('ignores invalid status not in [draft, applied, cancelled]', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: [] },
      });

      await listCounts({ status: 'invalid_status' });
      expect(spy).toHaveBeenCalledWith('/inventory/counts');
    });
  });

  describe('createCount', () => {
    it('rejects invalid location with status 422', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await createCount('invalida');

      expect(res.ok).toBe(false);
      expect(res.status).toBe(422);
      expect(res.error).toContain('no válida');
      expect(spy).not.toHaveBeenCalled();
    });

    it('creates draft count with valid location and optional notes', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 201,
        data: { data: { id: 10, location: 'kitchen', status: 'draft' } },
      });

      const res = await createCount('kitchen', 'Conteo de reapertura');
      expect(res.ok).toBe(true);
      expect(spy).toHaveBeenCalledWith('/inventory/counts', {
        method: 'POST',
        body: {
          location: 'kitchen',
          notes: 'Conteo de reapertura',
        },
      });
    });

    it('creates draft count without notes if not provided', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 201,
        data: { data: { id: 11, location: 'lounge', status: 'draft' } },
      });

      await createCount('lounge', '');
      expect(spy).toHaveBeenCalledWith('/inventory/counts', {
        method: 'POST',
        body: {
          location: 'lounge',
        },
      });
    });
  });

  describe('getCount', () => {
    it('rejects invalid countId', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await getCount('invalido');

      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(spy).not.toHaveBeenCalled();
    });

    it('fetches count details by id', async () => {
      const mockCount = { id: 5, location: 'warehouse', status: 'draft', lines: [] };
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: mockCount },
      });

      const res = await getCount(5);
      expect(res.ok).toBe(true);
      expect(spy).toHaveBeenCalledWith('/inventory/counts/5');
    });
  });

  describe('saveCountLines', () => {
    it('rejects invalid countId', async () => {
      const res = await saveCountLines(0, [{ item_id: 1, counted_quantity: '5' }]);
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
    });

    it('returns empty status for empty lines array without calling api', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await saveCountLines(5, []);
      expect(res.ok).toBe(true);
      expect(res.data.status).toBe('empty');
      expect(spy).not.toHaveBeenCalled();
    });

    it('rejects line with invalid item_id', async () => {
      const res = await saveCountLines(5, [{ item_id: 'invalido', counted_quantity: '5' }]);
      expect(res.ok).toBe(false);
      expect(res.status).toBe(422);
      expect(res.error).toContain('Identificador de insumo inválido');
    });

    it('rejects line with invalid counted_quantity format', async () => {
      const res = await saveCountLines(5, [{ item_id: 12, counted_quantity: '-4' }]);
      expect(res.ok).toBe(false);
      expect(res.status).toBe(422);
      expect(res.error).toContain('formato inválido');
      // El error queda junto al insumo, no solo en la cabecera.
      expect(res.lineErrors).toEqual({ 12: ['Usa solo números, con 3 decimales como máximo.'] });
    });

    it('accepts thousands typed with several commas only if the result is a valid number', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, data: { status: 'saved' } });
      const res = await saveCountLines(5, [{ item_id: 12, counted_quantity: '1,2,5' }]);
      expect(res.ok).toBe(false);
      expect(res.lineErrors[12]).toBeDefined();
      expect(spy).not.toHaveBeenCalled();
    });

    it('skips line if counted_quantity is null or undefined', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await saveCountLines(5, [{ item_id: 12, counted_quantity: null }]);
      expect(res.ok).toBe(true);
      expect(res.data.status).toBe('no_lines_to_save');
      expect(spy).not.toHaveBeenCalled();
    });

    it('normalizes comma to dot and sends lines', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { status: 'saved' },
      });

      const res = await saveCountLines(5, [
        { item_id: 1, counted_quantity: '10,5', note: 'Buen estado' },
        { item_id: 2, counted_quantity: '0' },
      ]);

      expect(res.ok).toBe(true);
      expect(spy).toHaveBeenCalledWith('/inventory/counts/5/lines', {
        method: 'PUT',
        body: {
          lines: [
            { item_id: 1, counted_quantity: '10.5', note: 'Buen estado' },
            { item_id: 2, counted_quantity: '0' },
          ],
        },
      });
    });

    it('batches lines in chunks of 200', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { status: 'saved' },
      });

      const lines = Array.from({ length: 205 }, (_, i) => ({
        item_id: i + 1,
        counted_quantity: '1',
      }));

      const res = await saveCountLines(7, lines);
      expect(res.ok).toBe(true);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0][1].body.lines.length).toBe(200);
      expect(spy.mock.calls[1][1].body.lines.length).toBe(5);
    });

    it('generates three requests of 200, 200, and 50 lines for 450 lines', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { status: 'saved' },
      });

      const lines = Array.from({ length: 450 }, (_, i) => ({
        item_id: i + 1,
        counted_quantity: '2',
      }));

      const res = await saveCountLines(7, lines);
      expect(res.ok).toBe(true);
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy.mock.calls[0][1].body.lines.length).toBe(200);
      expect(spy.mock.calls[1][1].body.lines.length).toBe(200);
      expect(spy.mock.calls[2][1].body.lines.length).toBe(50);
    });

    it('stops batching and returns error if an intermediate batch fails', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 409,
        error: 'El conteo ya fue aplicado',
      });

      const lines = Array.from({ length: 250 }, (_, i) => ({
        item_id: i + 1,
        counted_quantity: '2',
      }));

      const res = await saveCountLines(8, lines);
      expect(res.ok).toBe(false);
      expect(res.status).toBe(409);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('translates 422 errors of a batch to lineErrors mapped by item_id using batch offset', async () => {
      const spy = vi.spyOn(apiClient, 'request')
        .mockResolvedValueOnce({
          ok: true,
          data: { status: 'saved' },
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 422,
          data: {
            errors: {
              'lines.3.item_id': ['El insumo no existe en este negocio o no se puede contar.'],
            },
          },
        });

      // 205 lines: items 101 to 305.
      // Batch 1 has 200 items (0..199).
      // Batch 2 has 5 items (200..204). Index 3 of batch 2 is index 203 of total lines -> item_id = 304.
      const lines = Array.from({ length: 205 }, (_, i) => ({
        item_id: 101 + i,
        counted_quantity: '3.5',
      }));

      const res = await saveCountLines(10, lines);
      expect(res.ok).toBe(false);
      expect(res.status).toBe(422);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(res.lineErrors).toBeDefined();
      expect(res.lineErrors[304]).toEqual(['El insumo no existe en este negocio o no se puede contar.']);
    });
  });

  describe('applyCount', () => {
    it('rejects invalid countId', async () => {
      const res = await applyCount('invalido');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
    });

    it('calls apply endpoint successfully', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { status: 'applied', differences: [] },
      });

      const res = await applyCount(14);
      expect(res.ok).toBe(true);
      expect(spy).toHaveBeenCalledWith('/inventory/counts/14/apply', {
        method: 'POST',
      });
    });
  });

  describe('cancelCount', () => {
    it('rejects invalid countId', async () => {
      const res = await cancelCount('invalido');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
    });

    it('calls cancel endpoint successfully', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { status: 'cancelled' },
      });

      const res = await cancelCount(14);
      expect(res.ok).toBe(true);
      expect(spy).toHaveBeenCalledWith('/inventory/counts/14/cancel', {
        method: 'POST',
      });
    });
  });
});
