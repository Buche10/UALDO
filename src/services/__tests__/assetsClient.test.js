import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  listAssets,
  createAsset,
  updateAsset,
  setAssetStatus,
  importAssets,
  createAssetCount,
  getAssetCountForPeriod,
  getAssetCount,
  saveAssetCountLines,
  submitAssetCount,
  saveAssetExplanations,
  validateAssetCount,
  getAssetReport,
  ASSET_CATEGORIES,
  ASSET_STATUSES,
  ASSET_AREAS,
} from '../assetsClient';

vi.mock('../apiClient', () => ({
  request: vi.fn(),
}));

describe('assetsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constants', () => {
    it('defines valid categories, statuses and areas', () => {
      expect(ASSET_CATEGORIES).toEqual(['vajilla', 'cristaleria', 'equipo_salon', 'equipo_cocina']);
      expect(ASSET_STATUSES).toEqual(['activo', 'fuera_de_servicio', 'dado_de_baja']);
      expect(ASSET_AREAS).toEqual(['kitchen', 'lounge']);
    });
  });

  describe('listAssets', () => {
    it('calls GET /assets with valid filters', async () => {
      apiClient.request.mockResolvedValueOnce({ ok: true, status: 200, data: { data: [{ id: 1 }] } });

      const res = await listAssets({ category: 'vajilla', area: 'lounge', status: 'activo' });
      expect(apiClient.request).toHaveBeenCalledWith('/assets?category=vajilla&area=lounge&status=activo');
      expect(res.ok).toBe(true);
      expect(res.data).toEqual([{ id: 1 }]);
    });

    it('ignores invalid filters', async () => {
      apiClient.request.mockResolvedValueOnce({ ok: true, status: 200, data: [] });

      await listAssets({ category: 'desconocida', area: 'bodega' });
      expect(apiClient.request).toHaveBeenCalledWith('/assets');
    });
  });

  describe('createAsset', () => {
    it('validates required fields', async () => {
      const res1 = await createAsset({ category: 'invalida', name: 'Plato' });
      expect(res1.ok).toBe(false);

      const res2 = await createAsset({ category: 'vajilla', name: '', expected_quantity: 10 });
      expect(res2.ok).toBe(false);

      const res3 = await createAsset({ category: 'vajilla', name: 'Plato', expected_quantity: -1 });
      expect(res3.ok).toBe(false);
    });

    it('submits valid asset', async () => {
      apiClient.request.mockResolvedValueOnce({ ok: true, status: 201, data: { data: { id: 5 } } });

      const res = await createAsset({
        category: 'vajilla',
        name: 'Plato sopero',
        code: 'VAJ-05',
        expected_quantity: 30,
        min_quantity: 5,
        notes: 'Cerámica blanca',
      });

      expect(apiClient.request).toHaveBeenCalledWith('/assets', {
        method: 'POST',
        body: {
          category: 'vajilla',
          name: 'Plato sopero',
          code: 'VAJ-05',
          expected_quantity: 30,
          min_quantity: 5,
          notes: 'Cerámica blanca',
        },
      });
      expect(res.ok).toBe(true);
      expect(res.data).toEqual({ id: 5 });
    });
  });

  describe('updateAsset', () => {
    it('requires a reason when changing expected_quantity', async () => {
      const res = await updateAsset(7, { expected_quantity: 20 });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(422);
      expect(res.error).toContain('motivo');
    });

    it('sends PUT with valid reason', async () => {
      apiClient.request.mockResolvedValueOnce({ ok: true, status: 200, data: { data: { id: 7 } } });

      const res = await updateAsset(7, { expected_quantity: 20 }, 'Compra adicional de emergencia');
      expect(apiClient.request).toHaveBeenCalledWith('/assets/7', {
        method: 'PUT',
        body: {
          expected_quantity: 20,
          reason: 'Compra adicional de emergencia',
        },
      });
      expect(res.ok).toBe(true);
    });
  });

  describe('setAssetStatus', () => {
    it('validates id and status', async () => {
      const res1 = await setAssetStatus('abc', 'activo');
      expect(res1.ok).toBe(false);

      const res2 = await setAssetStatus(7, 'invalido');
      expect(res2.ok).toBe(false);
    });

    it('sends POST /assets/{id}/status', async () => {
      apiClient.request.mockResolvedValueOnce({ ok: true, status: 200, data: { id: 7, status: 'fuera_de_servicio' } });

      const res = await setAssetStatus(7, 'fuera_de_servicio', 'En mantenimiento preventivo');
      expect(apiClient.request).toHaveBeenCalledWith('/assets/7/status', {
        method: 'POST',
        body: {
          status: 'fuera_de_servicio',
          reason: 'En mantenimiento preventivo',
        },
      });
      expect(res.ok).toBe(true);
    });
  });

  describe('importAssets', () => {
    it('validates row count limits', async () => {
      const resEmpty = await importAssets([]);
      expect(resEmpty.ok).toBe(false);

      const tooMany = new Array(301).fill({ category: 'vajilla', name: 'Item', expected_quantity: 1 });
      const resTooMany = await importAssets(tooMany);
      expect(resTooMany.ok).toBe(false);
    });

    it('sends POST /assets/import', async () => {
      apiClient.request.mockResolvedValueOnce({ ok: true, status: 200, data: { imported: 2 } });

      const rows = [
        { category: 'vajilla', name: 'Plato', code: 'V-1', expected_quantity: 10, min_quantity: 2 },
      ];
      const res = await importAssets(rows);
      expect(apiClient.request).toHaveBeenCalledWith('/assets/import', {
        method: 'POST',
        body: { rows },
      });
      expect(res.ok).toBe(true);
    });
  });

  describe('count operations', () => {
    it('createAssetCount validates area and period', async () => {
      const res1 = await createAssetCount('bodega', '2026-11');
      expect(res1.ok).toBe(false);

      const res2 = await createAssetCount('lounge', 'noviembre');
      expect(res2.ok).toBe(false);

      apiClient.request.mockResolvedValueOnce({ ok: true, status: 201, data: { data: { id: 10 } } });
      const res3 = await createAssetCount('lounge', '2026-11');
      expect(res3.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith('/asset-counts', {
        method: 'POST',
        body: { area: 'lounge', period: '2026-11' },
      });
    });

    it('createAssetCount unwraps data.id on 409 conflict', async () => {
      apiClient.request.mockResolvedValueOnce({
        ok: false,
        status: 409,
        data: { data: { id: 42, status: 'draft' }, error: 'Ya existe' },
      });

      const res = await createAssetCount('lounge', '2026-11');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(409);
      expect(res.data).toEqual({ id: 42, status: 'draft' });
    });

    it('getAssetCountForPeriod queries GET /asset-counts?area=&period=', async () => {
      apiClient.request.mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { data: { id: 12, area: 'lounge', period: '2026-11', status: 'draft' } },
      });

      const res = await getAssetCountForPeriod('lounge', '2026-11');
      expect(res.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith('/asset-counts?area=lounge&period=2026-11');
      expect(res.data).toEqual({ id: 12, area: 'lounge', period: '2026-11', status: 'draft' });
    });

    it('getAssetCount queries GET /asset-counts/{id}', async () => {
      apiClient.request.mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { data: { id: 12, lines: [] } },
      });

      const res = await getAssetCount(12);
      expect(res.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith('/asset-counts/12');
      expect(res.data).toEqual({ id: 12, lines: [] });
    });

    it('saveAssetCountLines validates lines and sends PUT', async () => {
      const resBad = await saveAssetCountLines(10, [{ asset_id: 'x', counted_quantity: -1 }]);
      expect(resBad.ok).toBe(false);

      apiClient.request.mockResolvedValueOnce({ ok: true, status: 200, data: { data: { id: 10 } } });
      const resOk = await saveAssetCountLines(10, [{ asset_id: 3, counted_quantity: 12 }]);
      expect(resOk.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith('/asset-counts/10/lines', {
        method: 'PUT',
        body: { lines: [{ asset_id: 3, counted_quantity: 12 }] },
      });
    });

    it('submitAssetCount sends POST', async () => {
      apiClient.request.mockResolvedValueOnce({ ok: true, status: 200, data: { data: { id: 10, status: 'submitted' } } });
      const res = await submitAssetCount(10);
      expect(res.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith('/asset-counts/10/submit', { method: 'POST' });
    });

    it('saveAssetExplanations requires explanation for differences', async () => {
      const resBad = await saveAssetExplanations(10, [{ asset_id: 3, explanation: '' }]);
      expect(resBad.ok).toBe(false);

      apiClient.request.mockResolvedValueOnce({ ok: true, status: 200, data: { data: { id: 10 } } });
      const resOk = await saveAssetExplanations(10, [{ asset_id: 3, explanation: 'Rotura en servicio' }]);
      expect(resOk.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith('/asset-counts/10/explanations', {
        method: 'PUT',
        body: { lines: [{ asset_id: 3, explanation: 'Rotura en servicio' }] },
      });
    });

    it('validateAssetCount sends POST', async () => {
      apiClient.request.mockResolvedValueOnce({ ok: true, status: 200, data: { data: { id: 10, status: 'validated' } } });
      const res = await validateAssetCount(10);
      expect(res.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith('/asset-counts/10/validate', { method: 'POST' });
    });

    it('getAssetReport sends GET with query params', async () => {
      apiClient.request.mockResolvedValueOnce({ ok: true, status: 200, data: { data: { period: '2026-11' } } });
      const res = await getAssetReport('2026-11', 'lounge');
      expect(res.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith('/assets/report?period=2026-11&area=lounge');
    });
  });
});
