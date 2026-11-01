import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  normalizeWithdrawalQuantity,
  createWithdrawal,
  listWithdrawals,
  getWithdrawal,
  closeWithdrawal,
  cancelWithdrawal,
  getWithdrawalSettings,
  updateWithdrawalSettings,
} from '../withdrawalsClient';

describe('withdrawalsClient (Brief 32p & 32p_fix)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('normalizeWithdrawalQuantity', () => {
    it('normaliza cantidades válidas y convierte comas', () => {
      expect(normalizeWithdrawalQuantity('2')).toBe('2');
      expect(normalizeWithdrawalQuantity('1,5')).toBe('1.5');
      expect(normalizeWithdrawalQuantity('0.400')).toBe('0.400');
      expect(normalizeWithdrawalQuantity(0)).toBe('0');
    });

    it('rechaza valores inválidos, negativos o con más de 3 decimales', () => {
      expect(normalizeWithdrawalQuantity(null)).toBeNull();
      expect(normalizeWithdrawalQuantity('')).toBeNull();
      expect(normalizeWithdrawalQuantity('-1')).toBeNull();
      expect(normalizeWithdrawalQuantity('1.2345')).toBeNull();
      expect(normalizeWithdrawalQuantity('abc')).toBeNull();
    });
  });

  describe('createWithdrawal', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('valida que items tenga entre 1 y 15 elementos', async () => {
      const resEmpty = await createWithdrawal({ items: [], purpose: 'Producción', client_uuid: validUuid });
      expect(resEmpty.ok).toBe(false);
      expect(resEmpty.error).toContain('entre 1 y 15 insumos');

      const sixteenItems = Array.from({ length: 16 }, (_, i) => ({ item_id: i + 1, quantity: '1' }));
      const resTooMany = await createWithdrawal({ items: sixteenItems, purpose: 'Producción', client_uuid: validUuid });
      expect(resTooMany.ok).toBe(false);
      expect(resTooMany.error).toContain('entre 1 y 15 insumos');
    });

    it('valida cantidades en cada insumo', async () => {
      const res = await createWithdrawal({
        items: [{ item_id: 1, quantity: '-5' }],
        purpose: 'Producción',
        client_uuid: validUuid,
      });
      expect(res.ok).toBe(false);
      expect(res.lineErrors[1]).toBeDefined();
    });

    it('valida longitud del motivo (entre 3 y 200 caracteres)', async () => {
      const resShort = await createWithdrawal({
        items: [{ item_id: 1, quantity: '1' }],
        purpose: 'ab',
        client_uuid: validUuid,
      });
      expect(resShort.ok).toBe(false);
      expect(resShort.error).toContain('entre 3 y 200 caracteres');
    });

    it('valida formato de client_uuid', async () => {
      const resBadUuid = await createWithdrawal({
        items: [{ item_id: 1, quantity: '1' }],
        purpose: 'Producción',
        client_uuid: 'invalid-uuid',
      });
      expect(resBadUuid.ok).toBe(false);
      expect(resBadUuid.error).toContain('client_uuid inválido');
    });

    it('valida fecha de retiro tardío dentro de las 24 horas y motivo', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      const resFuture = await createWithdrawal({
        items: [{ item_id: 1, quantity: '1' }],
        purpose: 'Producción',
        client_uuid: validUuid,
        withdrawn_at: futureDate,
        late_reason: 'Motivo válido',
      });
      expect(resFuture.ok).toBe(false);
      expect(resFuture.error).toContain('futuro');

      const oldDate = new Date(Date.now() - 90000000).toISOString();
      const resOld = await createWithdrawal({
        items: [{ item_id: 1, quantity: '1' }],
        purpose: 'Producción',
        client_uuid: validUuid,
        withdrawn_at: oldDate,
        late_reason: 'Motivo válido',
      });
      expect(resOld.ok).toBe(false);
      expect(resOld.error).toContain('24 horas');

      const validDate = new Date(Date.now() - 3600000).toISOString();
      const resNoReason = await createWithdrawal({
        items: [{ item_id: 1, quantity: '1' }],
        purpose: 'Producción',
        client_uuid: validUuid,
        withdrawn_at: validDate,
        late_reason: '',
      });
      expect(resNoReason.ok).toBe(false);
      expect(resNoReason.error).toContain('motivo del retiro tardío');
    });

    it('desenvuelve la respuesta real { data: { ... } } del motor', async () => {
      const serverPayload = { id: 99, status: 'open', purpose: 'Mise en place' };
      vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: serverPayload },
      });

      const res = await createWithdrawal({
        items: [{ item_id: 1, quantity: '2' }],
        purpose: 'Mise en place',
        client_uuid: validUuid,
      });

      expect(res.ok).toBe(true);
      expect(res.data).toEqual(serverPayload);
    });

    it('mapea errores 422 de stock insuficiente a la línea del insumo', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: false,
        status: 422,
        error: 'En el sistema no hay suficiente Azúcar en Bodega (1.000 kg). Avisa a tu jefe.',
      });

      const res = await createWithdrawal({
        items: [{ item_id: 10, name: 'Azúcar', quantity: '2' }],
        to_location: 'kitchen',
        purpose: 'Tiramisú',
        client_uuid: validUuid,
      });

      expect(spy).toHaveBeenCalledWith('/withdrawals', {
        method: 'POST',
        body: {
          items: [{ item_id: 10, quantity: '2' }],
          to_location: 'kitchen',
          purpose: 'Tiramisú',
          client_uuid: validUuid,
        },
      });
      expect(res.lineErrors[10]).toBeDefined();
    });
  });

  describe('listWithdrawals y getWithdrawal', () => {
    it('listWithdrawals construye query parameters correctamente y no desenvuelve la paginación', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: [], meta: { current_page: 1, last_page: 1 } },
      });

      const res = await listWithdrawals({ status: 'open', from: '2026-11-01', to: '2026-11-01', page: 2 });
      expect(spy).toHaveBeenCalledWith('/withdrawals?status=open&from=2026-11-01&to=2026-11-01&page=2');
      expect(res.data.data).toEqual([]);

      await listWithdrawals();
      expect(spy).toHaveBeenCalledWith('/withdrawals');
    });

    it('getWithdrawal valida identificador y desenvuelve el objeto interno { data: { ... } }', async () => {
      const resInvalid = await getWithdrawal(0);
      expect(resInvalid.ok).toBe(false);
      expect(resInvalid.status).toBe(400);

      const withdrawalData = { id: 5, purpose: 'Tiramisú', lines: [] };
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: withdrawalData },
      });

      const resValid = await getWithdrawal(5);
      expect(resValid.ok).toBe(true);
      expect(spy).toHaveBeenCalledWith('/withdrawals/5');
      expect(resValid.data).toEqual(withdrawalData);
    });
  });

  describe('closeWithdrawal y cancelWithdrawal', () => {
    it('closeWithdrawal valida líneas, envía POST y desenvuelve la respuesta', async () => {
      const resNoLines = await closeWithdrawal(5, []);
      expect(resNoLines.ok).toBe(false);
      expect(resNoLines.status).toBe(422);

      const closedData = { id: 5, status: 'closed' };
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: closedData },
      });

      const resOk = await closeWithdrawal(5, [{ line_id: 1, consumed: '1.6', returned: '0.4' }], 'Quedó en cámara');
      expect(resOk.ok).toBe(true);
      expect(resOk.data).toEqual(closedData);
      expect(spy).toHaveBeenCalledWith('/withdrawals/5/close', {
        method: 'POST',
        body: {
          lines: [{ line_id: 1, consumed: '1.6', returned: '0.4' }],
          note: 'Quedó en cámara',
        },
      });
    });

    it('cancelWithdrawal valida identificador, envía POST y desenvuelve la respuesta', async () => {
      const resInvalid = await cancelWithdrawal('abc');
      expect(resInvalid.ok).toBe(false);
      expect(resInvalid.status).toBe(400);

      const cancelledData = { id: 12, status: 'cancelled' };
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: cancelledData },
      });

      const resOk = await cancelWithdrawal(12, 'Error de insumo');
      expect(resOk.ok).toBe(true);
      expect(resOk.data).toEqual(cancelledData);
      expect(spy).toHaveBeenCalledWith('/withdrawals/12/cancel', {
        method: 'POST',
        body: { note: 'Error de insumo' },
      });
    });
  });

  describe('ajustes de retiros (getWithdrawalSettings y updateWithdrawalSettings)', () => {
    it('getWithdrawalSettings consulta /withdrawals/settings y devuelve el objeto interno', async () => {
      const settingsData = {
        reminder_after_minutes: 45,
        reminder_interval_minutes: 90,
        max_reminders: 4,
        quiet_start: '01:00',
        quiet_end: '08:00',
      };
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: settingsData },
      });

      const res = await getWithdrawalSettings();
      expect(spy).toHaveBeenCalledWith('/withdrawals/settings');
      expect(res.data).toEqual(settingsData);
    });

    it('updateWithdrawalSettings valida rangos y formato de horas, y desenvuelve la respuesta', async () => {
      const resBadMin = await updateWithdrawalSettings({ reminder_after_minutes: 5 });
      expect(resBadMin.ok).toBe(false);
      expect(resBadMin.error).toContain('entre 15 y 1440');

      const resBadMax = await updateWithdrawalSettings({ max_reminders: 15 });
      expect(resBadMax.ok).toBe(false);
      expect(resBadMax.error).toContain('entre 1 y 10');

      const resBadTime = await updateWithdrawalSettings({ quiet_start: '25:00' });
      expect(resBadTime.ok).toBe(false);
      expect(resBadTime.error).toContain('formato HH:MM');

      const updatedSettings = {
        reminder_after_minutes: 60,
        reminder_interval_minutes: 60,
        max_reminders: 2,
        quiet_start: '01:00',
        quiet_end: '08:00',
      };
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        data: { data: updatedSettings },
      });

      const resOk = await updateWithdrawalSettings(updatedSettings);
      expect(resOk.ok).toBe(true);
      expect(resOk.data).toEqual(updatedSettings);
      expect(spy).toHaveBeenCalledWith('/withdrawals/settings', {
        method: 'PUT',
        body: updatedSettings,
      });
    });
  });
});
