import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  listMovements,
  createMovement,
  voidMovement
} from '../cashMovementsClient';

describe('cashMovementsClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('listMovements', () => {
    it('rechaza fecha invalida sin llamar a la API', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const res = await listMovements('2026-02-30');
      expect(res.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('construye la consulta con date y page', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: [] }
      });

      const res = await listMovements('2026-10-05', 2);
      expect(res.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-movements?date=2026-10-05&page=2');
    });
  });

  describe('createMovement', () => {
    it('exige contraparte en pago_efectivo, pago_transferencia y cheque', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');

      const resEfectivo = await createMovement({
        business_date: '2026-10-05',
        kind: 'pago_efectivo',
        counterparty: '',
        amount: '15.00'
      });
      expect(resEfectivo.ok).toBe(false);
      expect(resEfectivo.error).toContain('contraparte es obligatoria');
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('permite contraparte opcional en deposito', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 201,
        data: { id: 1 }
      });

      const resDeposito = await createMovement({
        business_date: '2026-10-05',
        kind: 'deposito',
        amount: '100.00'
      });
      expect(resDeposito.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-movements', {
        method: 'POST',
        body: {
          business_date: '2026-10-05',
          kind: 'deposito',
          counterparty: '',
          amount: '100.00',
          note: ''
        }
      });
    });

    it('rechaza montos menores o iguales a 0 y mayores a 100000', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');

      const resZero = await createMovement({
        business_date: '2026-10-05',
        kind: 'caja_chica',
        amount: '0'
      });
      expect(resZero.ok).toBe(false);

      const resTooBig = await createMovement({
        business_date: '2026-10-05',
        kind: 'caja_chica',
        amount: '100001'
      });
      expect(resTooBig.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('valida fecha de negocio, tipo, limites de longitud y client_uuid en payload', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 201,
        data: { id: 1 }
      });

      // Fecha invalida
      const resFecha = await createMovement({ business_date: 'invalida', kind: 'deposito', amount: '10' });
      expect(resFecha.ok).toBe(false);

      // Tipo invalido
      const resKind = await createMovement({ business_date: '2026-10-05', kind: 'invalido', amount: '10' });
      expect(resKind.ok).toBe(false);

      // Contraparte mayor a 120
      const resLongCounter = await createMovement({ business_date: '2026-10-05', kind: 'deposito', amount: '10', counterparty: 'x'.repeat(121) });
      expect(resLongCounter.ok).toBe(false);

      // Nota mayor a 200
      const resLongNote = await createMovement({ business_date: '2026-10-05', kind: 'deposito', amount: '10', note: 'x'.repeat(201) });
      expect(resLongNote.ok).toBe(false);

      // client_uuid en payload
      const resUuid = await createMovement({ business_date: '2026-10-05', kind: 'deposito', amount: '10', client_uuid: 'custom-uuid-123' });
      expect(resUuid.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-movements', expect.objectContaining({
        body: expect.objectContaining({ client_uuid: 'custom-uuid-123' })
      }));
    });
  });

  describe('voidMovement', () => {
    it('valida que el id sea un entero positivo', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const resBadId = await voidMovement('abc', 'error');
      expect(resBadId.ok).toBe(false);
      const resZeroId = await voidMovement(0, 'error');
      expect(resZeroId.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('valida que el motivo de anulacion sea obligatorio y hasta 200 caracteres', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const resEmpty = await voidMovement(1, '');
      expect(resEmpty.ok).toBe(false);
      const resTooLong = await voidMovement(1, 'x'.repeat(201));
      expect(resTooLong.ok).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('llama a /restaurant/cash-movements/{id}/anular con motivo', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { id: 5, anulado: true }
      });

      const res = await voidMovement(5, 'Duplicado');
      expect(res.ok).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('/restaurant/cash-movements/5/anular', {
        method: 'POST',
        body: { motivo: 'Duplicado' }
      });
    });
  });
});
