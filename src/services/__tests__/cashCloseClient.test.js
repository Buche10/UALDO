import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  isValidDate,
  listCloses,
  getClose,
  reviewClose,
  setNetosReales,
  reopenClose,
  createManualClose
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
});
