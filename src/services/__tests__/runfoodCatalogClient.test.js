import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  parseId,
  normalizeFactor,
  isValidSearch,
  listRunfoodMappings,
  updateRunfoodMapping,
  acceptRunfoodMappingSuggestion,
  ignoreRunfoodMapping,
  reopenRunfoodMapping,
  listRunfoodRecipes,
  getRunfoodCoverage
} from '../runfoodCatalogClient';

describe('runfoodCatalogClient service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseId', () => {
    it('valida enteros positivos y descarta valores no numéricos o negativos', () => {
      expect(parseId(12)).toBe(12);
      expect(parseId('45')).toBe(45);
      expect(parseId('  99  ')).toBe(99);
      expect(parseId(0)).toBeNull();
      expect(parseId('-5')).toBeNull();
      expect(parseId('abc')).toBeNull();
      expect(parseId(null)).toBeNull();
      expect(parseId(undefined)).toBeNull();
      expect(parseId('1.5')).toBeNull();
    });
  });

  describe('normalizeFactor', () => {
    it('acepta coma decimal o punto y normaliza a punto con hasta 6 decimales', () => {
      expect(normalizeFactor('1')).toBe('1');
      expect(normalizeFactor('1,5')).toBe('1.5');
      expect(normalizeFactor('0.250000')).toBe('0.250000');
      expect(normalizeFactor('100000')).toBe('100000');
      expect(normalizeFactor('0.000001')).toBe('0.000001');
      expect(normalizeFactor(2.5)).toBe('2.5');
    });

    it('rechaza 0, negativos, mayores a 100000 o más de 6 decimales', () => {
      expect(normalizeFactor('0')).toBeNull();
      expect(normalizeFactor('-1')).toBeNull();
      expect(normalizeFactor('100001')).toBeNull();
      expect(normalizeFactor('1.1234567')).toBeNull(); // 7 decimales
      expect(normalizeFactor('abc')).toBeNull();
      expect(normalizeFactor(null)).toBeNull();
      expect(normalizeFactor(undefined)).toBeNull();
    });
  });

  describe('isValidSearch', () => {
    it('valida longitud máxima de 60 caracteres', () => {
      expect(isValidSearch('Lomo fino')).toBe(true);
      expect(isValidSearch('a'.repeat(60))).toBe(true);
      expect(isValidSearch('a'.repeat(61))).toBe(false);
      expect(isValidSearch(null)).toBe(true);
      expect(isValidSearch(undefined)).toBe(true);
      expect(isValidSearch(123)).toBe(false);
    });
  });

  describe('listRunfoodMappings', () => {
    it('rechaza status desconocido sin llamar a la red', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await listRunfoodMappings({ status: 'invalid' });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(spy).not.toHaveBeenCalled();
    });

    it('rechaza búsqueda mayor a 60 caracteres', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await listRunfoodMappings({ search: 'x'.repeat(61) });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(spy).not.toHaveBeenCalled();
    });

    it('rechaza página inválida menor a 1', async () => {
      const res = await listRunfoodMappings({ page: 0 });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
    });

    it('construye la URL con parámetros correctos', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({ ok: true, data: { data: [] } });
      const res = await listRunfoodMappings({ status: 'pending', search: 'lomo', page: 2, per_page: 50 });
      expect(res.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith(
        '/restaurant/runfood/mappings?status=pending&search=lomo&page=2&per_page=50'
      );
    });
  });

  describe('updateRunfoodMapping', () => {
    it('rechaza id no numerico sin llamar al motor', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await updateRunfoodMapping('abc', { inventory_item_id: 1, factor: '1' });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(spy).not.toHaveBeenCalled();
    });

    it('rechaza inventory_item_id no numerico', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await updateRunfoodMapping(10, { inventory_item_id: 'no-id', factor: '1' });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(spy).not.toHaveBeenCalled();
    });

    it('rechaza factor invalido como 0 o 7 decimales', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res1 = await updateRunfoodMapping(10, { inventory_item_id: 5, factor: '0' });
      expect(res1.ok).toBe(false);
      expect(res1.status).toBe(400);

      const res2 = await updateRunfoodMapping(10, { inventory_item_id: 5, factor: '1.1234567' });
      expect(res2.ok).toBe(false);
      expect(res2.status).toBe(400);
      expect(spy).not.toHaveBeenCalled();
    });

    it('envia PUT con body normalizado cuando los datos son validos', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({ ok: true, data: { id: 10 } });
      const res = await updateRunfoodMapping('10', { inventory_item_id: '45', factor: '1,5' });
      expect(res.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith('/restaurant/runfood/mappings/10', {
        method: 'PUT',
        body: {
          inventory_item_id: 45,
          factor: '1.5'
        }
      });
    });
  });

  describe('acceptRunfoodMappingSuggestion', () => {
    it('valida id y envia POST', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({ ok: true, data: { id: 12 } });
      const res = await acceptRunfoodMappingSuggestion(12);
      expect(res.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith('/restaurant/runfood/mappings/12/aceptar-sugerencia', {
        method: 'POST'
      });
    });

    it('rechaza id invalido', async () => {
      const res = await acceptRunfoodMappingSuggestion('abc');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
    });
  });

  describe('ignoreRunfoodMapping', () => {
    it('valida id y envia POST', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({ ok: true, data: {} });
      const res = await ignoreRunfoodMapping('15');
      expect(res.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith('/restaurant/runfood/mappings/15/ignorar', {
        method: 'POST'
      });
    });
  });

  describe('reopenRunfoodMapping', () => {
    it('valida id y envia POST', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({ ok: true, data: {} });
      const res = await reopenRunfoodMapping(20);
      expect(res.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith('/restaurant/runfood/mappings/20/reabrir', {
        method: 'POST'
      });
    });
  });

  describe('listRunfoodRecipes', () => {
    it('rechaza estado desconocido', async () => {
      const res = await listRunfoodRecipes({ estado: 'otra' });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
    });

    it('rechaza per_page 0 y 101 sin llamar a la red', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res0 = await listRunfoodRecipes({ per_page: 0 });
      expect(res0.ok).toBe(false);
      expect(res0.status).toBe(400);
      expect(res0.error).toBe('Los registros por página deben estar entre 1 y 100.');

      const res101 = await listRunfoodRecipes({ per_page: 101 });
      expect(res101.ok).toBe(false);
      expect(res101.status).toBe(400);
      expect(res101.error).toBe('Los registros por página deben estar entre 1 y 100.');
      expect(spy).not.toHaveBeenCalled();
    });

    it('envía petición válida con query params', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({ ok: true, data: { data: [] } });
      const res = await listRunfoodRecipes({ estado: 'completa', search: 'bife', page: 1 });
      expect(res.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith('/restaurant/runfood/recipes?estado=completa&search=bife');
    });
  });

  describe('getRunfoodCoverage', () => {
    it('rechaza days fuera del rango 1 a 31', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res1 = await getRunfoodCoverage({ days: 0 });
      expect(res1.ok).toBe(false);
      expect(res1.status).toBe(400);

      const res2 = await getRunfoodCoverage({ days: 32 });
      expect(res2.ok).toBe(false);
      expect(res2.status).toBe(400);
      expect(spy).not.toHaveBeenCalled();
    });

    it('consulta cobertura con days por defecto 7 o personalizado', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({ ok: true, data: { dias_analizados: 7 } });
      const res1 = await getRunfoodCoverage();
      expect(res1.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith('/restaurant/runfood/coverage?days=7');

      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({ ok: true, data: { dias_analizados: 30 } });
      const res2 = await getRunfoodCoverage({ days: 30 });
      expect(res2.ok).toBe(true);
      expect(apiClient.request).toHaveBeenCalledWith('/restaurant/runfood/coverage?days=30');
    });
  });
});
