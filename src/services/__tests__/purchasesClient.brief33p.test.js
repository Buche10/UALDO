import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  updatePurchaseParams,
  receivePurchase,
  resolveLine,
  receiveExtra,
  listOtherPurchases,
  getReconciliation,
  getPurchasingSettings,
  updatePurchasingSettings,
  buildPurchaseLines,
} from '../purchasesClient';

describe('purchasesClient (Brief 33p additions)', () => {
  let spy;

  beforeEach(() => {
    vi.restoreAllMocks();
    spy = vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, data: { ok: true } });
  });

  describe('updatePurchaseParams', () => {
    it('validates id and normalized parameters before sending', async () => {
      const err = await updatePurchaseParams('abc', { base_quantity: '10' });
      expect(err.status).toBe(400);
      expect(spy).not.toHaveBeenCalled();

      await updatePurchaseParams(15, {
        base_quantity: '10,5',
        min_stock: '5',
        reorder_point: '8.25',
      });
      expect(spy).toHaveBeenCalledWith('/inventory/15/purchase-params', {
        method: 'PUT',
        body: {
          base_quantity: '10.5',
          min_stock: '5',
          reorder_point: '8.25',
        },
      });
    });

    it('rejects negative or malformed quantities', async () => {
      const res = await updatePurchaseParams(15, { base_quantity: '-2' });
      expect(res.status).toBe(422);
      expect(res.data.errors.base_quantity).toBeDefined();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('receivePurchase with lines', () => {
    it('validates lines payload structure and sends to backend', async () => {
      const lines = [
        { line_id: 101, received_quantity: '4,5' },
        { line_id: 102, received_quantity: '10' },
      ];
      await receivePurchase(22, lines);
      expect(spy).toHaveBeenCalledWith('/purchases/22/receive', {
        method: 'POST',
        body: {
          lines: [
            { line_id: 101, received_quantity: '4.5' },
            { line_id: 102, received_quantity: '10' },
          ],
        },
      });
    });

    it('rejects invalid or negative received quantities', async () => {
      const res = await receivePurchase(22, [{ line_id: 101, received_quantity: '-1' }]);
      expect(res.status).toBe(422);
      expect(res.data.errors['lines.0.received_quantity']).toBeDefined();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('resolveLine', () => {
    it('validates resolution type and mandatory note', async () => {
      const noNote = await resolveLine(22, 101, { resolution: 'aceptado', note: '   ' });
      expect(noNote.status).toBe(422);
      expect(noNote.data.errors.note).toBeDefined();

      const invalidType = await resolveLine(22, 101, { resolution: 'desconocido', note: 'nota' });
      expect(invalidType.status).toBe(422);

      await resolveLine(22, 101, { resolution: 'proveedor_completa', note: 'Entregara saldo el lunes' });
      expect(spy).toHaveBeenCalledWith('/purchases/22/lines/101/resolve', {
        method: 'POST',
        body: {
          resolution: 'proveedor_completa',
          note: 'Entregara saldo el lunes',
        },
      });
    });

    it('requires corrected_quantity for error_de_pesaje', async () => {
      const res = await resolveLine(22, 101, {
        resolution: 'error_de_pesaje',
        note: 'Balanza descalibrada',
        corrected_quantity: 'invalid',
      });
      expect(res.status).toBe(422);
      expect(res.data.errors.corrected_quantity).toBeDefined();

      await resolveLine(22, 101, {
        resolution: 'error_de_pesaje',
        note: 'Balanza descalibrada',
        corrected_quantity: '4,8',
      });
      expect(spy).toHaveBeenCalledWith('/purchases/22/lines/101/resolve', {
        method: 'POST',
        body: {
          resolution: 'error_de_pesaje',
          note: 'Balanza descalibrada',
          corrected_quantity: '4.8',
        },
      });
    });
  });

  describe('receiveExtra', () => {
    it('validates id and quantity > 0', async () => {
      const badQty = await receiveExtra(22, 101, '0');
      expect(badQty.status).toBe(422);
      expect(spy).not.toHaveBeenCalled();

      await receiveExtra(22, 101, '1,5');
      expect(spy).toHaveBeenCalledWith('/purchases/22/lines/101/receive-extra', {
        method: 'POST',
        body: { extra_quantity: '1.5' },
      });
    });
  });

  describe('listOtherPurchases and getReconciliation', () => {
    it('queries other purchases with date filters and page', async () => {
      await listOtherPurchases({ from: '2026-10-01', to: '2026-10-05', page: 2 });
      expect(spy).toHaveBeenCalledWith('/purchases/other?from=2026-10-01&to=2026-10-05&page=2');
    });

    it('queries reconciliation with date filter', async () => {
      await getReconciliation('2026-10-01');
      expect(spy).toHaveBeenCalledWith('/purchases/reconciliation?date=2026-10-01');
    });
  });

  describe('purchasing settings', () => {
    it('fetches settings and updates with normalized keys', async () => {
      await getPurchasingSettings();
      expect(spy).toHaveBeenCalledWith('/purchasing/settings');

      await updatePurchasingSettings({ reminder_time: '18:00', tolerance_percentage: '5' });
      expect(spy).toHaveBeenCalledWith('/purchasing/settings', {
        method: 'PUT',
        body: { reminder_time: '18:00', tolerance_percentage: '5' },
      });
    });
  });

  describe('buildPurchaseLines with is_other', () => {
    it('validates other purchase line attributes', () => {
      const invalidLine = buildPurchaseLines([
        { is_other: true, free_text_name: '', unit: '', quantity: '0', line_total: 'abc', note: '' },
      ]);
      expect(invalidLine.errors['lines.0.free_text_name']).toBeDefined();
      expect(invalidLine.errors['lines.0.quantity']).toBeDefined();
      expect(invalidLine.errors['lines.0.line_total']).toBeDefined();
      expect(invalidLine.errors['lines.0.note']).toBeDefined();

      const validLine = buildPurchaseLines([
        {
          is_other: true,
          free_text_name: 'Foco LED 10W',
          unit: 'unidad',
          quantity: '2',
          line_total: '8,50',
          note: 'Reposicion salon',
        },
      ]);
      expect(Object.keys(validLine.errors).length).toBe(0);
      expect(validLine.lines[0]).toEqual({
        is_other: true,
        free_text_name: 'Foco LED 10W',
        name: 'Foco LED 10W',
        unit: 'unidad',
        quantity: '2',
        line_total: '8.50',
        note: 'Reposicion salon',
      });
    });
  });
});
