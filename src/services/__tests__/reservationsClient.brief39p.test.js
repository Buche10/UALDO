import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import * as runfoodCatalogClient from '../runfoodCatalogClient';
import {
  buildReservationBody,
  cancelReservation,
  combineDateTime,
  createReservation,
  getAvailability,
  getReservation,
  getReservationAvailability,
  getReservationSettings,
  listReservations,
  setReservationStatus,
  todayGuayaquil,
  updateReservation,
  updateReservationSettings,
  validateReservedFor,
} from '../reservationsClient';
import { addDays } from '../../components/reservations/reservationUi';

const today = todayGuayaquil();
const futureDate = addDays(today, 3);
const FUTURE = combineDateTime(futureDate, '20:30');
const UUID = '123e4567-e89b-42d3-a456-426614174000';

describe('reservationsClient (Brief 39p)', () => {
  let spy;

  beforeEach(() => {
    vi.restoreAllMocks();
    spy = vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, data: { data: [] } });
  });

  describe('validaciones', () => {
    it('rechaza fechas pasadas y a más de 365 días', async () => {
      const past = await createReservation({
        reserved_for: combineDateTime(addDays(today, -1), '20:00'),
        party_size: 2,
        customer_name: 'Ana Cliente',
      });
      expect(past.status).toBe(422);
      expect(past.data.errors.reserved_for[0]).toMatch(/futuro/i);

      const far = await createReservation({
        reserved_for: combineDateTime(addDays(today, 400), '20:00'),
        party_size: 2,
        customer_name: 'Ana Cliente',
      });
      expect(far.status).toBe(422);
      expect(far.data.errors.reserved_for[0]).toMatch(/365/);
      expect(spy).not.toHaveBeenCalled();
    });

    it('valida personas entre 1 y 500 y nombre entre 2 y 80', () => {
      const low = buildReservationBody({ reserved_for: FUTURE, party_size: 0, customer_name: 'Ana Cliente' });
      const high = buildReservationBody({ reserved_for: FUTURE, party_size: 501, customer_name: 'Ana Cliente' });
      const shortName = buildReservationBody({ reserved_for: FUTURE, party_size: 2, customer_name: 'A' });
      const longName = buildReservationBody({ reserved_for: FUTURE, party_size: 2, customer_name: 'A'.repeat(81) });
      expect(low.errors.party_size).toBeDefined();
      expect(high.errors.party_size).toBeDefined();
      expect(shortName.errors.customer_name).toBeDefined();
      expect(longName.errors.customer_name).toBeDefined();
    });

    it('valida platos con artículo y cantidad 1 a 500', () => {
      const result = buildReservationBody({
        reserved_for: FUTURE,
        party_size: 2,
        customer_name: 'Ana Cliente',
        items: [{ runfood_article_id: 'abc', quantity: 0 }, { runfood_article_id: 4, quantity: 501 }],
      });
      expect(result.errors['items.0.runfood_article_id']).toBeDefined();
      expect(result.errors['items.0.quantity']).toBeDefined();
      expect(result.errors['items.1.quantity']).toBeDefined();
    });

    it('exige un client_uuid con formato UUID', () => {
      const result = buildReservationBody({
        reserved_for: FUTURE,
        party_size: 2,
        customer_name: 'Ana Cliente',
        client_uuid: 'no-es-uuid',
      });
      expect(result.errors.client_uuid).toBeDefined();
    });

    it('valida el formato de fecha y hora', () => {
      expect(combineDateTime('2026-02-30', '20:00')).toBeNull();
      expect(combineDateTime('2026-11-20', '25:00')).toBeNull();
      expect(combineDateTime('2026-11-20', '20:00')).toBe('2026-11-20 20:00:00');
      expect(validateReservedFor('no es fecha')).toMatch(/válida/i);
    });

    it('rechaza más de 200 ids de disponibilidad sin llamar al motor', async () => {
      const ids = Array.from({ length: 201 }, (_, index) => index + 1);
      const result = await getAvailability(ids);
      expect(result.status).toBe(422);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('rutas', () => {
    it('lista reservas con rango, estado y página', async () => {
      await listReservations({ from: today, to: futureDate, status: 'confirmada', page: 2 });
      expect(spy).toHaveBeenCalledWith(`/reservations?from=${today}&to=${futureDate}&status=confirmada&page=2`);
    });

    it('crea la reserva con cuerpo validado y client_uuid estable', async () => {
      await createReservation({
        reserved_for: FUTURE,
        party_size: 6,
        customer_name: '  Ana Cliente  ',
        customer_contact: '0991234567',
        area_note: 'Mesa junto a la ventana',
        notes: 'Cumpleaños',
        items: [{ runfood_article_id: 3, quantity: 15 }],
        client_uuid: UUID,
      });
      expect(spy).toHaveBeenCalledWith('/reservations', {
        method: 'POST',
        body: expect.objectContaining({
          reserved_for: FUTURE,
          party_size: 6,
          customer_name: 'Ana Cliente',
          customer_contact: '0991234567',
          client_uuid: UUID,
          items: [{ runfood_article_id: 3, quantity: 15 }],
        }),
      });
    });

    it('obtiene, edita, cancela y cambia el estado de una reserva', async () => {
      await getReservation(12);
      expect(spy).toHaveBeenCalledWith('/reservations/12');

      await updateReservation(12, { party_size: 8 });
      expect(spy).toHaveBeenCalledWith('/reservations/12', { method: 'PUT', body: { party_size: 8 } });

      await cancelReservation(12, 'El cliente avisó');
      expect(spy).toHaveBeenCalledWith('/reservations/12/cancel', { method: 'POST', body: { reason: 'El cliente avisó' } });

      await setReservationStatus(12, 'cumplida');
      expect(spy).toHaveBeenCalledWith('/reservations/12/status', { method: 'POST', body: { status: 'cumplida' } });
    });

    it('exige motivo al cancelar y un estado válido', async () => {
      expect((await cancelReservation(12, '   ')).status).toBe(422);
      expect((await setReservationStatus(12, 'confirmada')).status).toBe(422);
      expect(spy).not.toHaveBeenCalled();
    });

    it('consulta disponibilidad de hasta 200 insumos sin duplicados', async () => {
      await getAvailability([7, '7', 8]);
      expect(spy).toHaveBeenCalledWith('/inventory/availability?item_ids=7,8');
    });

    it('resuelve los insumos de los platos con las recetas de RunFood', async () => {
      vi.spyOn(runfoodCatalogClient, 'listRunfoodRecipes').mockResolvedValue({
        ok: true,
        data: {
          data: [{
            articulo_final: { runfood_id: 55, descripcion: 'Bife a la plancha' },
            lineas: [
              { mapeo: { status: 'confirmed', insumo: { id: 7 } } },
              { mapeo: { status: 'pending', insumo: { id: 9 } } },
            ],
          }],
        },
      });

      await getReservationAvailability([{ runfood_article_id: 55, name: 'Bife a la plancha', quantity: 2 }]);
      expect(runfoodCatalogClient.listRunfoodRecipes).toHaveBeenCalledWith({ search: 'Bife a la plancha', per_page: 100 });
      expect(spy).toHaveBeenCalledWith('/inventory/availability?item_ids=7');
    });

    it('no consulta disponibilidad si la reserva no tiene platos', async () => {
      const result = await getReservationAvailability([]);
      expect(result.ok).toBe(true);
      expect(result.data.data).toEqual([]);
      expect(spy).not.toHaveBeenCalled();
    });

    it('lee y guarda los ajustes de avisos', async () => {
      await getReservationSettings();
      expect(spy).toHaveBeenCalledWith('/reservations/settings');

      await updateReservationSettings({ day_before_time: '16:00', same_day_time: '11:30' });
      expect(spy).toHaveBeenCalledWith('/reservations/settings', {
        method: 'PUT',
        body: { day_before_time: '16:00', same_day_time: '11:30' },
      });
    });

    it('rechaza horas de aviso inválidas', async () => {
      const result = await updateReservationSettings({ day_before_time: '25:00' });
      expect(result.status).toBe(422);
      expect(result.data.errors.day_before_time).toBeDefined();
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
