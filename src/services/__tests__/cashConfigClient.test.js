import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  listPaymentMappings,
  assignBucket,
  acceptSuggestion,
  getCommissionRates,
  saveCommissionRate
} from '../cashConfigClient';

describe('cashConfigClient service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('assignBucket', () => {
    it('no envia peticion si bucket es sin_mapear o desconocido', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');

      const resSinMapear = await assignBucket(1, 'sin_mapear');
      expect(resSinMapear.ok).toBe(false);
      expect(resSinMapear.status).toBe(400);
      expect(requestSpy).not.toHaveBeenCalled();

      const resDesconocido = await assignBucket(1, 'cubeta_inexistente');
      expect(resDesconocido.ok).toBe(false);
      expect(resDesconocido.status).toBe(400);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('no envia peticion si el id no es entero positivo', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');

      const resNoEntero = await assignBucket('abc', 'efectivo');
      expect(resNoEntero.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();

      const resCero = await assignBucket(0, 'efectivo');
      expect(resCero.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('llama a PUT con id y bucket validos', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: { id: 5, bucket: 'credito' } }
      });

      const res = await assignBucket(5, 'credito');
      expect(res.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-close/payment-mappings/5', {
        method: 'PUT',
        body: { bucket: 'credito' }
      });
    });
  });

  describe('acceptSuggestion', () => {
    it('valida el id y llama a POST aceptar-sugerencia', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: { id: 10, bucket: 'diners' } }
      });

      const resInvalido = await acceptSuggestion(-1);
      expect(resInvalido.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();

      const res = await acceptSuggestion(10);
      expect(res.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-close/payment-mappings/10/aceptar-sugerencia', {
        method: 'POST'
      });
    });
  });

  describe('saveCommissionRate', () => {
    it('no envia peticion si rate_bp o retention_bp son mayores a 3000 o con decimales', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');

      const resMayor = await saveCommissionRate({
        card_type: 'credito',
        rate_bp: 3001,
        retention_bp: 200,
        effective_from: '2026-10-01'
      });
      expect(resMayor.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();

      const resDecimal = await saveCommissionRate({
        card_type: 'credito',
        rate_bp: 448.5,
        retention_bp: 200,
        effective_from: '2026-10-01'
      });
      expect(resDecimal.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('no envia peticion si card_type es desconocido o fecha invalida', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');

      const resCard = await saveCommissionRate({
        card_type: 'mastercard',
        rate_bp: 448,
        retention_bp: 200,
        effective_from: '2026-10-01'
      });
      expect(resCard.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();

      const resFecha = await saveCommissionRate({
        card_type: 'credito',
        rate_bp: 448,
        retention_bp: 200,
        effective_from: '2026-02-31'
      });
      expect(resFecha.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('llama a PUT con payload validado', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { current: [], history: [] }
      });

      const res = await saveCommissionRate({
        card_type: 'credito',
        rate_bp: 448,
        retention_bp: 200,
        effective_from: '2026-10-01'
      });
      expect(res.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-close/commission-rates', {
        method: 'PUT',
        body: {
          card_type: 'credito',
          rate_bp: 448,
          retention_bp: 200,
          effective_from: '2026-10-01'
        }
      });
    });
  });

  describe('listPaymentMappings y getCommissionRates', () => {
    it('consultan las rutas correspondientes', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: [] }
      });

      await listPaymentMappings();
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-close/payment-mappings');

      await getCommissionRates();
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-close/commission-rates');
    });
  });
});
