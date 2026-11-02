import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  createOvertime,
  voidOvertime,
  listOvertime,
  listOvertimeWorkers,
  getOvertimeSummary,
  isValidOvertimeHours,
  isValidOvertimeDate,
  isValidOvertimeMonth,
  getTodayDateString,
  getMinOvertimeDateString,
} from '../overtimeClient';

describe('overtimeClient (Brief 36p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('validaciones de horas', () => {
    it('acepta horas válidas en pasos de 0,25 hasta 12', () => {
      expect(isValidOvertimeHours(0.25)).toBe(true);
      expect(isValidOvertimeHours(0.5)).toBe(true);
      expect(isValidOvertimeHours(0.75)).toBe(true);
      expect(isValidOvertimeHours(1)).toBe(true);
      expect(isValidOvertimeHours('1.25')).toBe(true);
      expect(isValidOvertimeHours('2,5')).toBe(true);
      expect(isValidOvertimeHours(12)).toBe(true);
    });

    it('rechaza horas menores o iguales a 0 o mayores a 12', () => {
      expect(isValidOvertimeHours(0)).toBe(false);
      expect(isValidOvertimeHours(-1)).toBe(false);
      expect(isValidOvertimeHours(12.25)).toBe(false);
      expect(isValidOvertimeHours(15)).toBe(false);
    });

    it('rechaza horas que no sean múltiplos de 0,25', () => {
      expect(isValidOvertimeHours(0.1)).toBe(false);
      expect(isValidOvertimeHours(1.15)).toBe(false);
      expect(isValidOvertimeHours('2.33')).toBe(false);
      expect(isValidOvertimeHours('')).toBe(false);
      expect(isValidOvertimeHours(null)).toBe(false);
      expect(isValidOvertimeHours('abc')).toBe(false);
    });
  });

  describe('validaciones de fechas', () => {
    it('acepta fechas entre hoy y 7 días atrás', () => {
      const today = getTodayDateString();
      const minDate = getMinOvertimeDateString();
      expect(isValidOvertimeDate(today)).toBe(true);
      expect(isValidOvertimeDate(minDate)).toBe(true);
    });

    it('rechaza fechas futuras o con más de 7 días de antigüedad', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = getTodayDateString(tomorrow);

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);
      const oldDateStr = getTodayDateString(oldDate);

      expect(isValidOvertimeDate(tomorrowStr)).toBe(false);
      expect(isValidOvertimeDate(oldDateStr)).toBe(false);
      expect(isValidOvertimeDate('2026-02-30')).toBe(false);
      expect(isValidOvertimeDate('no-fecha')).toBe(false);
    });
  });

  describe('validación de mes', () => {
    it('acepta mes actual o pasado en formato AAAA-MM', () => {
      expect(isValidOvertimeMonth('2020-01')).toBe(true);
      expect(isValidOvertimeMonth('2026-10')).toBe(true);
    });

    it('rechaza formato inválido o mes futuro', () => {
      expect(isValidOvertimeMonth('2026-13')).toBe(false);
      expect(isValidOvertimeMonth('2099-01')).toBe(false);
      expect(isValidOvertimeMonth('octubre-2026')).toBe(false);
    });
  });

  describe('createOvertime', () => {
    it('crea un registro correctamente con worker_user_id', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 201,
        data: { id: 10, hours: 2.5 },
      });

      const today = getTodayDateString();
      const res = await createOvertime({
        area: 'kitchen',
        worker_user_id: 5,
        work_date: today,
        hours: 2.5,
        note: 'Apoyo en turno de noche',
      });

      expect(spy).toHaveBeenCalledWith('/overtime', {
        method: 'POST',
        body: {
          area: 'kitchen',
          worker_user_id: 5,
          work_date: today,
          hours: 2.5,
          note: 'Apoyo en turno de noche',
        },
      });
      expect(res.ok).toBe(true);
    });

    it('crea un registro correctamente con worker_name libre', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 201,
        data: { id: 11, worker_name: 'Carlos Mesero' },
      });

      const today = getTodayDateString();
      const res = await createOvertime({
        area: 'lounge',
        worker_name: 'Carlos Mesero',
        work_date: today,
        hours: 1.75,
      });

      expect(spy).toHaveBeenCalledWith('/overtime', {
        method: 'POST',
        body: {
          area: 'lounge',
          worker_name: 'Carlos Mesero',
          work_date: today,
          hours: 1.75,
        },
      });
      expect(res.ok).toBe(true);
    });

    it('rechaza si se envían ambos worker_user_id y worker_name', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const today = getTodayDateString();
      const res = await createOvertime({
        worker_user_id: 5,
        worker_name: 'Carlos',
        work_date: today,
        hours: 1,
      });

      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(res.error).toContain('no ambos');
      expect(spy).not.toHaveBeenCalled();
    });

    it('rechaza si no se envía ningún trabajador', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const today = getTodayDateString();
      const res = await createOvertime({
        work_date: today,
        hours: 1,
      });

      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(res.error).toContain('Debes indicar');
      expect(spy).not.toHaveBeenCalled();
    });

    it('rechaza si las horas no cumplen los pasos de 0,25', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const today = getTodayDateString();
      const res = await createOvertime({
        worker_user_id: 5,
        work_date: today,
        hours: 1.3,
      });

      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(res.error).toContain('0,25');
      expect(spy).not.toHaveBeenCalled();
    });

    it('pasa client_uuid para idempotencia si se provee', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { id: 10 },
      });

      const today = getTodayDateString();
      await createOvertime(
        {
          worker_user_id: 5,
          work_date: today,
          hours: 2,
        },
        'uuid-1234'
      );

      expect(spy).toHaveBeenCalledWith('/overtime', expect.objectContaining({
        body: expect.objectContaining({ client_uuid: 'uuid-1234' }),
      }));
    });
  });

  describe('voidOvertime', () => {
    it('valida id y motivo antes de enviar POST anulación', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { id: 7, voided: true },
      });

      const res = await voidOvertime(7, 'Error en el registro del turno');
      expect(spy).toHaveBeenCalledWith('/overtime/7/void', {
        method: 'POST',
        body: { reason: 'Error en el registro del turno' },
      });
      expect(res.ok).toBe(true);
    });

    it('rechaza motivo menor a 5 caracteres', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await voidOvertime(7, 'abc');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(res.error).toContain('entre 5 y 300 caracteres');
      expect(spy).not.toHaveBeenCalled();
    });

    it('rechaza identificador inválido', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await voidOvertime('abc', 'Motivo válido');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(res.error).toContain('Identificador');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('listOvertime y listOvertimeWorkers', () => {
    it('construye los parámetros de filtro correctamente', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: [], meta: {} },
      });

      await listOvertime({
        page: 2,
        from: '2026-10-01',
        to: '2026-10-31',
        area: 'kitchen',
        worker: 'Danny',
      });

      expect(spy).toHaveBeenCalledWith(
        '/overtime?page=2&from=2026-10-01&to=2026-10-31&area=kitchen&worker=Danny'
      );
    });

    it('desenvuelve trabajadores de área en listOvertimeWorkers', async () => {
      const workers = [{ id: 1, name: 'Chef Juan' }];
      vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: workers },
      });

      const res = await listOvertimeWorkers('kitchen');
      expect(res.ok).toBe(true);
      expect(res.data).toEqual(workers);
    });
  });

  describe('getOvertimeSummary', () => {
    it('rechaza mes futuro', async () => {
      const res = await getOvertimeSummary('2099-01');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(res.error).toContain('no puede ser futuro');
    });

    it('desenvuelve resumen mensual exitoso', async () => {
      const summaryData = { month: '2026-10', total_hours: 15, workers: [] };
      vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: summaryData },
      });

      const res = await getOvertimeSummary('2026-10');
      expect(res.ok).toBe(true);
      expect(res.data).toEqual(summaryData);
    });
  });
});
