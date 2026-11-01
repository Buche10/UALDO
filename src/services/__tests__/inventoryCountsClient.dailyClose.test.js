import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  createDailyClose,
  submitCount,
  saveExplanations,
  validateCount,
  escalateCount,
  getDailyCloseSummary,
  getDailyCloseSettings,
  updateDailyCloseSettings,
  SALES_PENDING_CODE,
  VALID_EXPLANATION_CAUSES,
} from '../inventoryCountsClient';

describe('inventoryCountsClient daily close methods (Brief 31 / 31p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDailyClose', () => {
    it('valida ubicación inválida localmente antes de enviar', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await createDailyClose('invalida', '2026-11-01');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(422);
      expect(res.error).toBe('Ubicación de conteo no válida.');
      expect(spy).not.toHaveBeenCalled();
    });

    it('valida formato de fecha localmente antes de enviar', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await createDailyClose('kitchen', '01-11-2026');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(422);
      expect(res.error).toContain('Fecha no válida');
      expect(spy).not.toHaveBeenCalled();
    });

    it('envía POST /inventory/counts con purpose daily_close y fecha de jornada', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 201,
        data: { data: { id: 10, purpose: 'daily_close', location: 'kitchen', business_date: '2026-11-01' } },
      });

      const res = await createDailyClose('kitchen', '2026-11-01');
      expect(res.ok).toBe(true);
      expect(spy).toHaveBeenCalledWith('/inventory/counts', {
        method: 'POST',
        body: {
          purpose: 'daily_close',
          location: 'kitchen',
          business_date: '2026-11-01',
        },
      });
    });
  });

  describe('submitCount', () => {
    it('valida identificador de conteo inválido', async () => {
      const res = await submitCount('abc');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
    });

    it('envía POST /inventory/counts/{id}/submit', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: { id: 10, status: 'submitted' } },
      });

      const res = await submitCount(10);
      expect(res.ok).toBe(true);
      expect(spy).toHaveBeenCalledWith('/inventory/counts/10/submit', { method: 'POST' });
    });

    it('asigna code SALES_PENDING ante 409 por ventas pendientes de RunFood', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: false,
        status: 409,
        error: 'Falta descontar las ventas del día. Intenta de nuevo en unos minutos.',
      });

      const res = await submitCount(10);
      expect(res.ok).toBe(false);
      expect(res.status).toBe(409);
      expect(res.code).toBe(SALES_PENDING_CODE);
    });

    it('asigna code SALES_PENDING ante 409 cuando RunFood todavia no envia ventas', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: false,
        status: 409,
        error: 'RunFood todavía no envió las ventas del día. El cierre se podrá enviar cuando lleguen.',
      });

      const res = await submitCount(10);
      expect(res.ok).toBe(false);
      expect(res.status).toBe(409);
      expect(res.code).toBe(SALES_PENDING_CODE);
    });
  });

  describe('saveExplanations', () => {
    it('valida identificador de conteo', async () => {
      const res = await saveExplanations(0, []);
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
    });

    it('valida que lines sea un arreglo', async () => {
      const res = await saveExplanations(10, 'no-es-arreglo');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(422);
    });

    it('valida causa no permitida', async () => {
      const res = await saveExplanations(10, [
        { item_id: 5, cause: 'causa_inventada', explanation: 'texto' },
      ]);
      expect(res.ok).toBe(false);
      expect(res.status).toBe(422);
      expect(res.error).toBe('Causa de explicación no válida.');
    });

    it('exige explicacion obligatoria cuando la causa es otro', async () => {
      const res = await saveExplanations(10, [
        { item_id: 5, cause: 'otro', explanation: '   ' },
      ]);
      expect(res.ok).toBe(false);
      expect(res.status).toBe(422);
      expect(res.error).toContain('obligatoria cuando la causa es Otro');
    });

    it('valida longitud maxima de 500 caracteres', async () => {
      const longText = 'a'.repeat(501);
      const res = await saveExplanations(10, [
        { item_id: 5, cause: 'otro', explanation: longText },
      ]);
      expect(res.ok).toBe(false);
      expect(res.status).toBe(422);
      expect(res.error).toContain('500 caracteres');
    });

    it('envía PUT /inventory/counts/{id}/explanations con datos normalizados', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: { id: 10 } },
      });

      const res = await saveExplanations(10, [
        { item_id: '5', cause: 'merma_no_registrada', explanation: '  Se cayó una botella  ' },
        { item_id: 8, cause: 'error_de_conteo', explanation: '' },
      ]);

      expect(res.ok).toBe(true);
      expect(spy).toHaveBeenCalledWith('/inventory/counts/10/explanations', {
        method: 'PUT',
        body: {
          lines: [
            { item_id: 5, cause: 'merma_no_registrada', explanation: 'Se cayó una botella' },
            { item_id: 8, cause: 'error_de_conteo', explanation: null },
          ],
        },
      });
    });
  });

  describe('validateCount y escalateCount', () => {
    it('validateCount envía POST /inventory/counts/{id}/validate', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: { id: 10, status: 'validated' } },
      });

      const res = await validateCount(10);
      expect(res.ok).toBe(true);
      expect(spy).toHaveBeenCalledWith('/inventory/counts/10/validate', { method: 'POST' });
    });

    it('escalateCount exige nota obligatoria', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await escalateCount(10, '   ');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(422);
      expect(res.error).toBe('Debes ingresar un motivo para escalar.');
      expect(spy).not.toHaveBeenCalled();
    });

    it('escalateCount envía POST /inventory/counts/{id}/escalate con nota recortada', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: { id: 10, status: 'escalated' } },
      });

      const res = await escalateCount(10, '  Falta aclarar merma  ');
      expect(res.ok).toBe(true);
      expect(spy).toHaveBeenCalledWith('/inventory/counts/10/escalate', {
        method: 'POST',
        body: { note: 'Falta aclarar merma' },
      });
    });
  });

  describe('consultas y ajustes de cierre diario', () => {
    it('getDailyCloseSummary consulta sin fecha o con fecha validada', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, data: { data: {} } });

      await getDailyCloseSummary();
      expect(spy).toHaveBeenCalledWith('/inventory/daily-close');

      await getDailyCloseSummary('2026-10-31');
      expect(spy).toHaveBeenCalledWith('/inventory/daily-close?date=2026-10-31');

      const invalid = await getDailyCloseSummary('fecha-invalida');
      expect(invalid.ok).toBe(false);
      expect(invalid.status).toBe(422);
    });

    it('getDailyCloseSettings consulta /inventory/daily-close/settings', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, data: { data: {} } });
      await getDailyCloseSettings();
      expect(spy).toHaveBeenCalledWith('/inventory/daily-close/settings');
    });

    it('updateDailyCloseSettings envía PUT /inventory/daily-close/settings', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, data: { data: {} } });
      await updateDailyCloseSettings({
        reminder_time: '23:00',
        escalation_time: '13:00',
        locations: ['kitchen', 'lounge'],
      });
      expect(spy).toHaveBeenCalledWith('/inventory/daily-close/settings', {
        method: 'PUT',
        body: {
          reminder_time: '23:00',
          escalation_time: '13:00',
          locations: ['kitchen', 'lounge'],
        },
      });
    });
  });
});
