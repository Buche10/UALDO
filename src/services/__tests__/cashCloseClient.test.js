import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  isValidDate,
  isValidDeclarationDate,
  DIFFERENCE_CAUSES,
  DIFFERENCE_CAUSE_LABELS,
  listCloses,
  getClose,
  reviewClose,
  setNetosReales,
  reopenClose,
  createManualClose,
  reevaluateClose,
  getDeclaration,
  submitDeclaration,
  getCashCloseSettings,
  updateCashCloseSettings,
} from '../cashCloseClient';

describe('cashCloseClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('isValidDate', () => {
    it('valida fechas reales en formato YYYY-MM-DD', () => {
      expect(isValidDate('2026-10-07')).toBe(true);
      expect(isValidDate('2024-02-29')).toBe(true);
    });

    it('rechaza fechas invalidas, no existentes o mal formadas', () => {
      expect(isValidDate('2026-02-30')).toBe(false);
      expect(isValidDate('2026-13-01')).toBe(false);
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate('2026/10/05')).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });
  });

  describe('isValidDeclarationDate', () => {
    it('admite hoy, ayer, today, yesterday y fechas validas YYYY-MM-DD', () => {
      expect(isValidDeclarationDate('hoy')).toBe(true);
      expect(isValidDeclarationDate('Ayer')).toBe(true);
      expect(isValidDeclarationDate('today')).toBe(true);
      expect(isValidDeclarationDate('yesterday')).toBe(true);
      expect(isValidDeclarationDate('2026-11-02')).toBe(true);
    });

    it('rechaza alias no permitidos o fechas invalidas', () => {
      expect(isValidDeclarationDate('manana')).toBe(false);
      expect(isValidDeclarationDate('2026-02-30')).toBe(false);
      expect(isValidDeclarationDate('')).toBe(false);
      expect(isValidDeclarationDate(null)).toBe(false);
    });
  });

  describe('DIFFERENCE_CAUSES', () => {
    it('contiene la lista cerrada del Brief 35 y sus etiquetas', () => {
      expect(DIFFERENCE_CAUSES).toContain('error_de_conteo');
      expect(DIFFERENCE_CAUSES).toContain('vuelto_mal_dado');
      expect(DIFFERENCE_CAUSES).toContain('pago_no_registrado_en_runfood');
      expect(DIFFERENCE_CAUSES).toContain('propina_mezclada');
      expect(DIFFERENCE_CAUSES).toContain('faltante_sin_explicar');
      expect(DIFFERENCE_CAUSES).toContain('otro');
      expect(DIFFERENCE_CAUSES.length).toBe(6);
      expect(DIFFERENCE_CAUSE_LABELS.otro).toBe('Otro');
    });
  });

  describe('getClose', () => {
    it('no realiza la peticion si la fecha es invalida o no existe', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const res = await getClose('2026-02-30');

      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('codifica la consulta con URLSearchParams para fecha valida', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: [{ fecha: '2026-10-05' }] }
      });

      const res = await getClose('2026-10-05');
      expect(res.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-close?date=2026-10-05');
    });
  });

  describe('listCloses', () => {
    it('consulta la lista de cierres', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: [] }
      });

      const res = await listCloses();
      expect(res.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-close');
    });
  });

  describe('reviewClose', () => {
    it('rechaza claves fuera de la lista blanca sin llamar a la API', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const res = await reviewClose('2026-10-05', {
        efectivo_contado: '150.00',
        clave_prohibida: 'hack'
      });

      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(res.error).toContain('Clave no permitida');
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('rechaza fecha invalida sin llamar a la API', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const res = await reviewClose('bad-date', { efectivo_contado: '100' });

      expect(res.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('envia claves de la lista blanca con fecha codificada en la ruta', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { fecha: '2026-10-05' }
      });

      const res = await reviewClose('2026-10-05', {
        efectivo_contado: '150.00',
        observacion: 'Revisado por dueño'
      });

      expect(res.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-close/2026-10-05', {
        method: 'PUT',
        body: {
          efectivo_contado: '150.00',
          observacion: 'Revisado por dueño'
        }
      });
    });
  });

  describe('setNetosReales', () => {
    it('requiere al menos un neto real y rechaza claves ajenas', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const resEmpty = await setNetosReales('2026-10-05', {});
      expect(resEmpty.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();

      const resInvalidKey = await setNetosReales('2026-10-05', { clave_falsa: '10' });
      expect(resInvalidKey.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('envia los netos reales si son validos', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { fecha: '2026-10-05' }
      });

      const res = await setNetosReales('2026-10-05', { tarjeta_neto: '120.50' });
      expect(res.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-close/2026-10-05/netos-reales', {
        method: 'POST',
        body: { tarjeta_neto: '120.50' }
      });
    });
  });

  describe('reopenClose', () => {
    it('exige motivo no vacio de hasta 300 caracteres', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const resEmpty = await reopenClose('2026-10-05', '');
      expect(resEmpty.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();

      const longReason = 'a'.repeat(301);
      const resLong = await reopenClose('2026-10-05', longReason);
      expect(resLong.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('envia motivo valido a /reabrir', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { fecha: '2026-10-05' }
      });

      const res = await reopenClose('2026-10-05', 'Correccion de arqueo');
      expect(res.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-close/2026-10-05/reabrir', {
        method: 'POST',
        body: { motivo: 'Correccion de arqueo' }
      });
    });
  });

  describe('createManualClose', () => {
    it('valida la fecha antes de enviar', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const res = await createManualClose({ fecha: 'invalid' });
      expect(res.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('envia datos validos con POST /restaurant/cash-close', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 201,
        data: { fecha: '2026-10-05' }
      });

      const res = await createManualClose({ fecha: '2026-10-05', efectivo: '200' });
      expect(res.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-close', {
        method: 'POST',
        body: { fecha: '2026-10-05', efectivo: '200' }
      });
    });
  });

  describe('reevaluateClose', () => {
    it('valida la fecha antes de realizar la peticion', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const res = await reevaluateClose('invalid-date');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('llama a POST /restaurant/cash-close/{fecha}/reevaluar', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: { fecha: '2026-10-05', status: 'cerrado' } }
      });

      const res = await reevaluateClose('2026-10-05');
      expect(res.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-close/2026-10-05/reevaluar', {
        method: 'POST'
      });
    });
  });

  describe('getDeclaration (Brief 35p)', () => {
    it('rechaza fechas invalidas sin llamar al motor', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const res = await getDeclaration('2026-02-31');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('consulta la declaracion con fecha valida o alias hoy/ayer', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: { fecha: '2026-11-02', estado: 'borrador' } },
      });

      const res = await getDeclaration('hoy');
      expect(res.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-close/hoy/declaracion');
    });
  });

  describe('submitDeclaration (Brief 35p)', () => {
    it('rechaza fecha invalida sin llamar al motor', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const res = await submitDeclaration('bad-date', { efectivo_contado: '150.00' });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('rechaza efectivo contado vacio o invalido', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const res = await submitDeclaration('hoy', { efectivo_contado: 'invalido' });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('rechaza medios con monto invalido o medio no string', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const res = await submitDeclaration('hoy', {
        efectivo_contado: '100.00',
        medios: [{ medio: 'credito', monto: 'abc' }],
      });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('rechaza diferencia_cause fuera de la lista cerrada', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const res = await submitDeclaration('hoy', {
        efectivo_contado: '100.00',
        difference_cause: 'causa_inventada',
      });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('rechaza explicacion con HTML o mas de 500 caracteres', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const res = await submitDeclaration('hoy', {
        efectivo_contado: '100.00',
        difference_explanation: '<script>alert(1)</script>',
      });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('envia los datos normalizados y devuelve ok en caso de exito', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { message: 'Cierre registrado y cerrado' },
      });

      const res = await submitDeclaration('hoy', {
        efectivo_contado: '150,50',
        medios: [{ medio: 'credito', monto: '486,37' }],
        difference_cause: 'error_de_conteo',
        difference_explanation: 'Se conto mal el billete de 20.',
      });

      expect(res.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-close/hoy/declaracion', {
        method: 'PUT',
        body: {
          efectivo_contado: '150.50',
          medios: [{ medio: 'credito', monto: '486.37' }],
          difference_cause: 'error_de_conteo',
          difference_explanation: 'Se conto mal el billete de 20.',
        },
      });
    });

    it('devuelve resultado estructurado de recuento ante respuesta 409 con code recount', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: false,
        status: 409,
        data: {
          code: 'recount',
          message: 'Hay una diferencia de USD 10.00 en efectivo. Vuelve a contar antes de seguir.',
          medio: 'efectivo',
          diferencia: 1000,
        },
      });

      const res = await submitDeclaration('hoy', { efectivo_contado: '140.00' });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(409);
      expect(res.isRecount).toBe(true);
      expect(res.recount).toBe(true);
      expect(res.medio).toBe('efectivo');
      expect(res.diferencia).toBe(1000);
      expect(res.message).toContain('Vuelve a contar antes de seguir');
    });
  });

  describe('getCashCloseSettings y updateCashCloseSettings (Brief 35p)', () => {
    it('getCashCloseSettings consulta /restaurant/cash-close/settings', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { head_declaration: true, reminder_time: '23:00', escalation_time: '11:00' },
      });

      const res = await getCashCloseSettings();
      expect(res.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-close/settings');
    });

    it('updateCashCloseSettings rechaza payload invalido sin campos', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const res = await updateCashCloseSettings({});
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('updateCashCloseSettings valida booleanos y formato de horas <= 23:45', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const resBadBool = await updateCashCloseSettings({ head_declaration: 'true' });
      expect(resBadBool.ok).toBe(false);

      const resBadTime = await updateCashCloseSettings({ reminder_time: '25:00' });
      expect(resBadTime.ok).toBe(false);

      const resOverLimit = await updateCashCloseSettings({ reminder_time: '23:50' });
      expect(resOverLimit.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('updateCashCloseSettings envia PUT con los ajustes normalizados', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { head_declaration: true, reminder_time: '23:15', escalation_time: '11:30' },
      });

      const res = await updateCashCloseSettings({
        head_declaration: true,
        reminder_time: '23:15',
        escalation_time: '11:30',
      });
      expect(res.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-close/settings', {
        method: 'PUT',
        body: {
          head_declaration: true,
          reminder_time: '23:15',
          escalation_time: '11:30',
        },
      });
    });
  });
});
