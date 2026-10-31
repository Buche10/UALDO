import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  isValidDate,
  countDaysInRange,
  validateDateRange,
  getSalesSummary,
  getSalesItems,
  getSalesHours,
  getSalesToday
} from '../salesClient';

describe('salesClient service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('isValidDate', () => {
    it('valida formato AAAA-MM-DD y fecha real', () => {
      expect(isValidDate('2026-10-23')).toBe(true);
      expect(isValidDate('2024-02-29')).toBe(true); // anio bisiesto
      expect(isValidDate('2023-02-29')).toBe(false); // no bisiesto
      expect(isValidDate('2026-04-31')).toBe(false); // abril tiene 30 dias
      expect(isValidDate('2026-13-01')).toBe(false); // mes inexistente
      expect(isValidDate('23-10-2026')).toBe(false); // formato incorrecto
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(12345)).toBe(false);
    });
  });

  describe('countDaysInRange', () => {
    it('calcula los dias inclusive en el rango', () => {
      expect(countDaysInRange('2026-10-01', '2026-10-01')).toBe(1);
      expect(countDaysInRange('2026-10-01', '2026-10-07')).toBe(7);
      expect(countDaysInRange('2026-01-01', '2026-01-31')).toBe(31);
    });
  });

  describe('validateDateRange', () => {
    it('retorna error cuando from tiene formato invalido', () => {
      const err = validateDateRange('2026-02-30', '2026-03-05');
      expect(err).toEqual({
        ok: false,
        status: 400,
        error: 'Fecha inicial inválida. Debe tener formato AAAA-MM-DD y ser una fecha real.'
      });
    });

    it('retorna error cuando to tiene formato invalido', () => {
      const err = validateDateRange('2026-03-01', 'no-fecha');
      expect(err).toEqual({
        ok: false,
        status: 400,
        error: 'Fecha final inválida. Debe tener formato AAAA-MM-DD y ser una fecha real.'
      });
    });

    it('retorna error si from es posterior a to', () => {
      const err = validateDateRange('2026-10-25', '2026-10-20');
      expect(err).toEqual({
        ok: false,
        status: 400,
        error: 'La fecha inicial no puede ser posterior a la final.'
      });
    });

    it('retorna error si el rango excede los 92 dias', () => {
      // 93 dias: 31 (ene) + 28 (feb) + 31 (mar) + 3 (abr) = 93 dias
      const err = validateDateRange('2026-01-01', '2026-04-03');
      expect(err).toEqual({
        ok: false,
        status: 400,
        error: 'El rango máximo permitido es de 92 días.'
      });
    });

    it('retorna null para rangos validos de hasta 92 dias', () => {
      // 92 dias: 31 + 28 + 31 + 2 = 92 dias
      expect(validateDateRange('2026-01-01', '2026-04-02')).toBeNull();
      expect(validateDateRange('2026-10-01', '2026-10-07')).toBeNull();
      expect(validateDateRange(undefined, undefined)).toBeNull();
    });
  });

  describe('getSalesSummary', () => {
    it('rechaza fecha invalida sin llamar al motor', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await getSalesSummary({ from: 'invalido' });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(spy).not.toHaveBeenCalled();
    });

    it('llama a /restaurant/sales/summary con query params cuando son validos', async () => {
      const mockData = { totales: { pedidos: 10, total: '150.00' }, dias: [] };
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: mockData
      });

      const res = await getSalesSummary({ from: '2026-10-01', to: '2026-10-07' });
      expect(res.ok).toBe(true);
      expect(res.data).toEqual(mockData);
      expect(apiClient.request).toHaveBeenCalledWith('/restaurant/sales/summary?from=2026-10-01&to=2026-10-07');
    });

    it('llama a endpoint base sin query params cuando no se especifican', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {}
      });

      await getSalesSummary();
      expect(apiClient.request).toHaveBeenCalledWith('/restaurant/sales/summary');
    });

    it('propaga error del motor', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 403,
        error: 'Acción permitida solo para el dueño.'
      });

      const res = await getSalesSummary();
      expect(res.ok).toBe(false);
      expect(res.status).toBe(403);
      expect(res.error).toBe('Acción permitida solo para el dueño.');
    });
  });

  describe('getSalesItems', () => {
    it('rechaza sort invalido sin llamar al motor', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await getSalesItems({ sort: 'unsupported' });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(res.error).toContain('sort');
      expect(spy).not.toHaveBeenCalled();
    });

    it('rechaza pagina menor a 1 o no entera', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res1 = await getSalesItems({ page: 0 });
      expect(res1.ok).toBe(false);
      expect(res1.status).toBe(400);

      const res2 = await getSalesItems({ page: 1.5 });
      expect(res2.ok).toBe(false);
      expect(res2.status).toBe(400);
      expect(spy).not.toHaveBeenCalled();
    });

    it('normaliza articulos asignando id desde articulo_id y estructura meta', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          current_page: 1,
          last_page: 2,
          total: 25,
          per_page: 20,
          data: [
            {
              articulo_id: 101,
              codigo: 'A1',
              descripcion: 'Plato A',
              stockeable: false,
              cantidad: '15.000',
              total: '150.00',
              participacion: '25.0'
            }
          ]
        }
      });

      const res = await getSalesItems({ from: '2026-10-01', to: '2026-10-07', sort: 'total', page: 1 });
      expect(res.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith(
        '/restaurant/sales/items?from=2026-10-01&to=2026-10-07&sort=total&page=1'
      );
      expect(res.data.data[0].id).toBe(101);
      expect(res.data.meta).toEqual({
        current_page: 1,
        last_page: 2,
        total: 25,
        per_page: 20
      });
    });

    it('propaga error del motor sin normalizar', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 500,
        error: 'Error interno del servidor.'
      });

      const res = await getSalesItems();
      expect(res.ok).toBe(false);
      expect(res.status).toBe(500);
    });
  });

  describe('getSalesHours', () => {
    it('valida rango antes de consultar', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await getSalesHours({ from: '2026-10-10', to: '2026-10-01' });
      expect(res.ok).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });

    it('consulta horas con query params validos', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { dias_en_rango: 7, horas: [] }
      });

      const res = await getSalesHours({ from: '2026-10-01', to: '2026-10-07' });
      expect(res.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith('/restaurant/sales/hours?from=2026-10-01&to=2026-10-07');
    });
  });

  describe('getSalesToday', () => {
    it('retorna la foto parcial en 200', async () => {
      const mockSnapshot = {
        business_date: '2026-10-30',
        totales: { pedidos: 5, total: '80.00' }
      };
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: mockSnapshot
      });

      const res = await getSalesToday();
      expect(res.ok).toBe(true);
      expect(res.data).toEqual(mockSnapshot);
    });

    it('convierte respuesta 404 en ok: true con data: null', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 404,
        error: 'No encontrado'
      });

      const res = await getSalesToday();
      expect(res.ok).toBe(true);
      expect(res.data).toBeNull();
      expect(res.status).toBe(404);
    });

    it('propaga otros errores HTTP como 500 o 403', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 500,
        error: 'Error del servidor'
      });

      const res = await getSalesToday();
      expect(res.ok).toBe(false);
      expect(res.status).toBe(500);
    });
  });
});
