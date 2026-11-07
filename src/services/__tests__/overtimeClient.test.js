import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  createOvertime,
  voidOvertime,
  approveOvertime,
  rejectOvertime,
  pendingOvertimeCount,
  listOvertime,
  listOvertimeWorkers,
  getOvertimeSummary,
  isValidOvertimeHours,
  isValidOvertimeDate,
  isValidOvertimeMonth,
  getTodayDateString,
  getMinOvertimeDateString,
} from '../overtimeClient';

describe('overtimeClient (Brief 36p y Brief 46p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('validaciones de dominio de horas', () => {
    it('acepta horas válidas en cuartos hasta 12', () => {
      expect(isValidOvertimeHours(0.25)).toBe(true);
      expect(isValidOvertimeHours('0.5')).toBe(true);
      expect(isValidOvertimeHours('1,75')).toBe(true);
      expect(isValidOvertimeHours(12)).toBe(true);
    });

    it('rechaza 0, negativos, mayores a 12 o no múltiplos de 0.25', () => {
      expect(isValidOvertimeHours(0)).toBe(false);
      expect(isValidOvertimeHours(-1)).toBe(false);
      expect(isValidOvertimeHours(12.25)).toBe(false);
      expect(isValidOvertimeHours(1.3)).toBe(false);
      expect(isValidOvertimeHours('abc')).toBe(false);
      expect(isValidOvertimeHours(null)).toBe(false);
    });
  });

  describe('validaciones de fecha de trabajo', () => {
    it('acepta fechas entre hoy y 7 días atrás', () => {
      const today = getTodayDateString();
      const minDate = getMinOvertimeDateString();
      expect(isValidOvertimeDate(today)).toBe(true);
      expect(isValidOvertimeDate(minDate)).toBe(true);
    });

    it('rechaza fechas futuras o mayores a 7 días atrás o formato inválido', () => {
      expect(isValidOvertimeDate('2099-01-01')).toBe(false);
      expect(isValidOvertimeDate('2020-01-01')).toBe(false);
      expect(isValidOvertimeDate('01-01-2026')).toBe(false);
      expect(isValidOvertimeDate('invalid')).toBe(false);
    });
  });

  describe('createOvertime', () => {
    it('envía los datos correctos al endpoint POST /overtime', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 201,
        data: { id: 1 },
      });

      const today = getTodayDateString();
      const res = await createOvertime({
        area: 'kitchen',
        worker_user_id: 12,
        work_date: today,
        hours: '2,5',
        note: 'Refuerzo cena',
      });

      expect(spy).toHaveBeenCalledWith('/overtime', {
        method: 'POST',
        body: {
          area: 'kitchen',
          worker_user_id: 12,
          work_date: today,
          hours: 2.5,
          note: 'Refuerzo cena',
        },
      });
      expect(res.ok).toBe(true);
    });

    it('soporta registrar con nombre libre cuando no es usuario del sistema', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 201,
        data: { id: 2 },
      });

      const today = getTodayDateString();
      await createOvertime({
        area: 'lounge',
        worker_name: 'Ana Refuerzo',
        work_date: today,
        hours: 1,
      });

      expect(spy).toHaveBeenCalledWith('/overtime', {
        method: 'POST',
        body: {
          area: 'lounge',
          worker_name: 'Ana Refuerzo',
          work_date: today,
          hours: 1,
        },
      });
    });

    it('rechaza si se envían ambos o ninguno entre worker_user_id y worker_name', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const today = getTodayDateString();

      const resAmbos = await createOvertime({
        worker_user_id: 1,
        worker_name: 'Pedro',
        work_date: today,
        hours: 1,
      });
      expect(resAmbos.ok).toBe(false);
      expect(resAmbos.error).toContain('no ambos');

      const resNinguno = await createOvertime({
        work_date: today,
        hours: 1,
      });
      expect(resNinguno.ok).toBe(false);
      expect(resNinguno.error).toContain('Debes indicar el trabajador');

      expect(spy).not.toHaveBeenCalled();
    });

    it('falla localmente si las horas son inválidas sin llamar a la red', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const today = getTodayDateString();

      const res = await createOvertime({
        worker_user_id: 1,
        work_date: today,
        hours: 0,
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

  describe('approveOvertime y rejectOvertime (Brief 46p)', () => {
    it('approveOvertime valida id numérico y envía POST', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { id: 15, status: 'approved' },
      });

      const res = await approveOvertime(15);
      expect(spy).toHaveBeenCalledWith('/overtime/15/approve', {
        method: 'POST',
      });
      expect(res.ok).toBe(true);
    });

    it('approveOvertime rechaza id inválido', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await approveOvertime('invalido');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(res.error).toContain('Identificador');
      expect(spy).not.toHaveBeenCalled();
    });

    it('rejectOvertime valida id y motivo de 3 a 300 caracteres', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { id: 15, status: 'rejected' },
      });

      const res = await rejectOvertime(15, 'Horas no autorizadas previamente');
      expect(spy).toHaveBeenCalledWith('/overtime/15/reject', {
        method: 'POST',
        body: { note: 'Horas no autorizadas previamente' },
      });
      expect(res.ok).toBe(true);
    });

    it('rejectOvertime rechaza motivo de menos de 3 caracteres', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await rejectOvertime(15, 'no');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(res.error).toContain('entre 3 y 300 caracteres');
      expect(spy).not.toHaveBeenCalled();
    });

    it('pendingOvertimeCount llama al endpoint GET', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { count: 3 },
      });

      const res = await pendingOvertimeCount();
      expect(spy).toHaveBeenCalledWith('/overtime/pending-count');
      expect(res.ok).toBe(true);
    });
  });

  describe('listOvertime y listOvertimeWorkers', () => {
    it('construye los parámetros de filtro correctamente incluyendo status', async () => {
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
        status: 'pending',
      });

      expect(spy).toHaveBeenCalledWith(
        '/overtime?page=2&from=2026-10-01&to=2026-10-31&area=kitchen&worker=Danny&status=pending'
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
