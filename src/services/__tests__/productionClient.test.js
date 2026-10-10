import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  listTemplates,
  getTemplate,
  getPlan,
  listRuns,
  getRun,
  recordRun,
  voidRun,
  normalizeProductionQuantity,
} from '../productionClient';

describe('productionClient', () => {
  let spy;

  beforeEach(() => {
    vi.restoreAllMocks();
    spy = vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, status: 200, data: {} });
  });

  describe('normalizeProductionQuantity', () => {
    it('accepts comma, trims and keeps text', () => {
      expect(normalizeProductionQuantity(' 4,5 ')).toBe('4.5');
      expect(normalizeProductionQuantity('0')).toBe('0');
      expect(normalizeProductionQuantity('12.125')).toBe('12.125');
    });

    it('rejects invalid formats', () => {
      ['', '1.2345', '-1', 'abc', '1,2,3', '12345678', null, undefined].forEach((value) => {
        expect(normalizeProductionQuantity(value)).toBeNull();
      });
    });
  });

  it('lists templates with include_inactive only when asked', async () => {
    await listTemplates();
    expect(spy).toHaveBeenLastCalledWith('/production-templates');
    await listTemplates({ includeInactive: true });
    expect(spy).toHaveBeenLastCalledWith('/production-templates?include_inactive=1');
  });

  it('validates ids before building template and run routes', async () => {
    for (const fn of [getTemplate, getRun]) {
      // '1e2' es un entero para Number pero parseInt daría 1: se rechaza.
      expect((await fn('1e2')).status).toBe(400);
      const res = await fn('1; DROP');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
    }
    expect(spy).not.toHaveBeenCalled();

    await getTemplate(7);
    expect(spy).toHaveBeenLastCalledWith('/production-templates/7');
    await getRun('9');
    expect(spy).toHaveBeenLastCalledWith('/production-runs/9');
  });

  it('requests the plan with a normalized quantity and rejects zero or invalid', async () => {
    await getPlan(3, '4,5');
    expect(spy).toHaveBeenLastCalledWith('/production-templates/3/plan?input_quantity=4.5');

    for (const value of ['0', '1.2345', '']) {
      const res = await getPlan(3, value);
      expect(res.ok).toBe(false);
      expect(res.status).toBe(422);
    }
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('lists runs with filters through URLSearchParams', async () => {
    await listRuns();
    expect(spy).toHaveBeenLastCalledWith('/production-runs');
    await listRuns({ templateId: 4, status: 'voided', page: 2 });
    expect(spy).toHaveBeenLastCalledWith('/production-runs?template_id=4&status=voided&page=2');
    await listRuns({ templateId: 'x', status: 'otro', page: 1 });
    expect(spy).toHaveBeenLastCalledWith('/production-runs');
  });

  describe('recordRun', () => {
    const base = {
      templateId: 3,
      location: 'kitchen',
      inputs: [{ item_id: 1, quantity: '4,000' }],
      outputs: [{ item_id: 2, quantity: '8' }, { item_id: 3, quantity: '0' }],
      mainOutputWeight: '2,8',
      wasteQuantity: '0.25',
      notes: '  Pieza grande  ',
    };

    it('sends quantities as normalized text with the client uuid', async () => {
      await recordRun(base, 'uuid-1');
      expect(spy).toHaveBeenCalledWith('/production-runs', {
        method: 'POST',
        body: {
          template_id: 3,
          location: 'kitchen',
          inputs: [{ item_id: 1, quantity: '4.000' }],
          outputs: [{ item_id: 2, quantity: '8' }, { item_id: 3, quantity: '0' }],
          main_output_weight: '2.8',
          waste_quantity: '0.25',
          notes: 'Pieza grande',
          client_uuid: 'uuid-1',
        },
      });
    });

    it('omits optional fields that are empty', async () => {
      await recordRun({ ...base, location: '', mainOutputWeight: '', wasteQuantity: null, notes: '' }, 'uuid-2');
      const body = spy.mock.calls[0][1].body;
      expect(body).not.toHaveProperty('location');
      expect(body).not.toHaveProperty('main_output_weight');
      expect(body).not.toHaveProperty('waste_quantity');
      expect(body).not.toHaveProperty('notes');
    });

    it('rejects invalid data without calling the engine', async () => {
      const cases = [
        { ...base, templateId: 0 },
        { ...base, location: 'bodega' },
        { ...base, inputs: [] },
        { ...base, inputs: [{ item_id: 1, quantity: '0' }] },
        { ...base, inputs: [{ item_id: 'x', quantity: '1' }] },
        { ...base, outputs: [{ item_id: 2, quantity: '1.2345' }] },
        { ...base, mainOutputWeight: 'abc' },
      ];
      for (const payload of cases) {
        const res = await recordRun(payload, 'uuid');
        expect(res.ok).toBe(false);
        expect(res.status).toBe(422);
      }
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('voidRun', () => {
    it('sends the trimmed reason', async () => {
      await voidRun(5, '  Se registró dos veces ');
      expect(spy).toHaveBeenCalledWith('/production-runs/5/void', { method: 'POST', body: { reason: 'Se registró dos veces' } });
    });

    it('rejects an empty or too long reason and invalid ids', async () => {
      expect((await voidRun(5, '   ')).status).toBe(422);
      expect((await voidRun(5, 'x'.repeat(256))).status).toBe(422);
      expect((await voidRun(-1, 'Error')).status).toBe(400);
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
