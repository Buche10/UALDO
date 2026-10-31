import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  parseIsoDateParts,
  isValidDateString,
  toIsoDateString,
  getYesterdayIsoString,
  validateStartDate,
  validateRecalculateRange,
  getConsumptionSettings,
  updateConsumptionSettings,
  getConsumption,
  recalculateConsumption
} from '../runfoodConsumptionClient';

describe('runfoodConsumptionClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseIsoDateParts & isValidDateString', () => {
    it('valida fechas reales y rechaza formatos invalidos o dias imposibles', () => {
      expect(isValidDateString('2026-10-29')).toBe(true);
      expect(isValidDateString('2024-02-29')).toBe(true); // bisiesto
      expect(isValidDateString('2023-02-29')).toBe(false); // no bisiesto
      expect(isValidDateString('2026-04-31')).toBe(false); // abril tiene 30
      expect(isValidDateString('invalid')).toBe(false);
      expect(isValidDateString('')).toBe(false);
      expect(isValidDateString(null)).toBe(false);
      expect(isValidDateString('2026/10/29')).toBe(false);
    });

    it('devuelve las partes numericas correctas', () => {
      const parts = parseIsoDateParts('2026-10-31');
      expect(parts).not.toBeNull();
      expect(parts.year).toBe(2026);
      expect(parts.month).toBe(10);
      expect(parts.day).toBe(31);
    });
  });

  describe('date helpers', () => {
    it('toIsoDateString formatea correctamente una fecha', () => {
      const d = new Date(2026, 9, 15); // mes 9 es octubre
      expect(toIsoDateString(d)).toBe('2026-10-15');
    });

    it('getYesterdayIsoString devuelve el dia anterior', () => {
      const ref = new Date(2026, 9, 15);
      expect(getYesterdayIsoString(ref)).toBe('2026-10-14');
    });
  });

  describe('validateStartDate', () => {
    const todayRef = new Date(2026, 9, 15); // 2026-10-15

    it('acepta fechas dentro de los 30 dias anteriores y posteriores', () => {
      expect(validateStartDate('2026-10-15', todayRef).valid).toBe(true);
      expect(validateStartDate('2026-09-15', todayRef).valid).toBe(true); // -30 dias
      expect(validateStartDate('2026-11-14', todayRef).valid).toBe(true); // +30 dias
    });

    it('rechaza fechas mayores a 30 dias de diferencia o con formato invalido', () => {
      const resOld = validateStartDate('2026-09-10', todayRef);
      expect(resOld.valid).toBe(false);
      expect(resOld.error).toContain('30 días');

      const resFuture = validateStartDate('2026-11-20', todayRef);
      expect(resFuture.valid).toBe(false);

      const resInvalid = validateStartDate('fecha-invalida', todayRef);
      expect(resInvalid.valid).toBe(false);
      expect(resInvalid.error).toContain('AAAA-MM-DD');
    });
  });

  describe('validateRecalculateRange', () => {
    it('acepta rangos validos de hasta 31 dias con desde <= hasta', () => {
      const res = validateRecalculateRange('2026-10-01', '2026-10-31');
      expect(res.valid).toBe(true);
      expect(res.days).toBe(31);

      const singleDay = validateRecalculateRange('2026-10-15', '2026-10-15');
      expect(singleDay.valid).toBe(true);
      expect(singleDay.days).toBe(1);
    });

    it('rechaza si desde es mayor a hasta', () => {
      const res = validateRecalculateRange('2026-10-20', '2026-10-10');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('no puede ser posterior');
    });

    it('rechaza si el rango supera 31 dias', () => {
      const res = validateRecalculateRange('2026-10-01', '2026-11-05');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('31 días');
    });

    it('rechaza fechas con formato invalido', () => {
      expect(validateRecalculateRange('mal', '2026-10-15').valid).toBe(false);
      expect(validateRecalculateRange('2026-10-15', 'mal').valid).toBe(false);
    });
  });

  describe('getConsumptionSettings', () => {
    it('consulta la configuracion con el endpoint correcto', async () => {
      const mockSettings = { enabled: true, start_date: '2026-10-01', location: 'kitchen' };
      const reqSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: mockSettings
      });

      const res = await getConsumptionSettings();
      expect(reqSpy).toHaveBeenCalledWith('/restaurant/runfood/consumption/settings');
      expect(res.ok).toBe(true);
      expect(res.data).toEqual(mockSettings);
    });
  });

  describe('updateConsumptionSettings', () => {
    it('permite desactivar sin start_date', async () => {
      const reqSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { enabled: false, start_date: null, location: 'kitchen' }
      });

      const res = await updateConsumptionSettings({ enabled: false, location: 'kitchen' });
      expect(reqSpy).toHaveBeenCalledWith('/restaurant/runfood/consumption/settings', {
        method: 'PUT',
        body: { enabled: false, start_date: null, location: 'kitchen' }
      });
      expect(res.ok).toBe(true);
    });

    it('valida que enabled sea booleano', async () => {
      const reqSpy = vi.spyOn(apiClient, 'request');
      const res = await updateConsumptionSettings({ enabled: 'true' });
      expect(res.ok).toBe(false);
      expect(res.error).toContain('booleano');
      expect(reqSpy).not.toHaveBeenCalled();
    });

    it('valida la ubicacion permitida', async () => {
      const reqSpy = vi.spyOn(apiClient, 'request');
      const res = await updateConsumptionSettings({ enabled: false, location: 'patio' });
      expect(res.ok).toBe(false);
      expect(res.error).toContain('Ubicación de inventario no permitida');
      expect(reqSpy).not.toHaveBeenCalled();
    });

    it('exige start_date al activar', async () => {
      const reqSpy = vi.spyOn(apiClient, 'request');
      const res = await updateConsumptionSettings({ enabled: true, location: 'kitchen' });
      expect(res.ok).toBe(false);
      expect(res.error).toContain('fecha de inicio es obligatoria');
      expect(reqSpy).not.toHaveBeenCalled();
    });

    it('activa con exito con parametros validos', async () => {
      const todayIso = toIsoDateString();
      const reqSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { enabled: true, start_date: todayIso, location: 'warehouse' }
      });

      const res = await updateConsumptionSettings({
        enabled: true,
        start_date: todayIso,
        location: 'warehouse'
      });

      expect(reqSpy).toHaveBeenCalledWith('/restaurant/runfood/consumption/settings', {
        method: 'PUT',
        body: { enabled: true, start_date: todayIso, location: 'warehouse' }
      });
      expect(res.ok).toBe(true);
    });
  });

  describe('getConsumption', () => {
    it('consulta la fecha con el parametro query', async () => {
      const reqSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { fecha: '2026-10-29', estado: 'aplicado', lineas: [] }
      });

      const res = await getConsumption('2026-10-29');
      expect(reqSpy).toHaveBeenCalledWith('/restaurant/runfood/consumption?date=2026-10-29');
      expect(res.ok).toBe(true);
    });

    it('sin fecha consulta sin parametro date', async () => {
      const reqSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { estado: 'aplicado' }
      });

      const res = await getConsumption();
      expect(reqSpy).toHaveBeenCalledWith('/restaurant/runfood/consumption');
      expect(res.ok).toBe(true);
    });

    it('rechaza fecha con formato invalido sin llamar a la api', async () => {
      const reqSpy = vi.spyOn(apiClient, 'request');
      const res = await getConsumption('29-10-2026');
      expect(res.ok).toBe(false);
      expect(res.error).toContain('AAAA-MM-DD');
      expect(reqSpy).not.toHaveBeenCalled();
    });
  });

  describe('recalculateConsumption', () => {
    it('envia la peticion si el rango es valido', async () => {
      const reqSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { status: 'queued', dias_encolados: 5 }
      });

      const res = await recalculateConsumption({
        desde: '2026-10-01',
        hasta: '2026-10-05'
      });

      expect(reqSpy).toHaveBeenCalledWith('/restaurant/runfood/consumption/recalcular', {
        method: 'POST',
        body: { desde: '2026-10-01', hasta: '2026-10-05' }
      });
      expect(res.ok).toBe(true);
      expect(res.data.dias_encolados).toBe(5);
    });

    it('rechaza rango invalido antes de llamar a la api', async () => {
      const reqSpy = vi.spyOn(apiClient, 'request');
      const res = await recalculateConsumption({
        desde: '2026-10-10',
        hasta: '2026-10-01'
      });

      expect(res.ok).toBe(false);
      expect(reqSpy).not.toHaveBeenCalled();
    });
  });
});
