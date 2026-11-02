import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  getLot,
  getLotSettings,
  getNextLot,
  listLots,
  markLotUnfit,
  normalizeAgeAlertDays,
  setRequiresLot,
  updateLotSettings,
  isValidLotCode,
} from '../lotsClient';

describe('lotsClient (Brief 40p)', () => {
  let spy;

  beforeEach(() => {
    vi.restoreAllMocks();
    spy = vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, data: { data: [] } });
  });

  it('valida el código de lote L más cuatro cifras o más', () => {
    expect(isValidLotCode('L0001')).toBe(true);
    expect(isValidLotCode('L12345')).toBe(true);
    expect(isValidLotCode('L001')).toBe(false);
    expect(isValidLotCode('0001')).toBe(false);
    expect(isValidLotCode('L0001A')).toBe(false);
  });

  it('lista lotes con filtros válidos y página', async () => {
    await listLots({ itemId: 4, status: 'activo', location: 'kitchen', page: 2 });
    expect(spy).toHaveBeenCalledWith('/lots?item_id=4&status=activo&location=kitchen&page=2');
  });

  it('rechaza filtros inválidos antes de llamar al motor', async () => {
    expect((await listLots({ itemId: 'abc' })).status).toBe(400);
    expect((await listLots({ status: 'podrido' })).status).toBe(422);
    expect((await listLots({ location: 'patio' })).status).toBe(422);
    expect(spy).not.toHaveBeenCalled();
  });

  it('consulta el siguiente lote y la trazabilidad paginada', async () => {
    await getNextLot(4, 'kitchen');
    expect(spy).toHaveBeenCalledWith('/lots/next?item_id=4&location=kitchen');

    await getLot(12, 3);
    expect(spy).toHaveBeenCalledWith('/lots/12?page=3');

    expect((await getLot('x')).status).toBe(400);
    expect((await getNextLot('x', 'kitchen')).status).toBe(400);
  });

  it('marca no apto con motivo de 5 a 300 caracteres', async () => {
    const short = await markLotUnfit(12, 'poco');
    expect(short.status).toBe(422);
    expect(short.data.errors.reason).toBeDefined();

    const long = await markLotUnfit(12, 'a'.repeat(301));
    expect(long.status).toBe(422);

    await markLotUnfit(12, '  Olor extraño al abrir la funda  ');
    expect(spy).toHaveBeenCalledWith('/lots/12/unfit', {
      method: 'POST',
      body: { reason: 'Olor extraño al abrir la funda' },
    });
  });

  it('activa o desactiva el control por lotes de un insumo', async () => {
    await setRequiresLot(8, true);
    expect(spy).toHaveBeenCalledWith('/inventory/8/requires-lot', {
      method: 'PUT',
      body: { requires_lot: true },
    });

    expect((await setRequiresLot('x', true)).status).toBe(400);
    expect((await setRequiresLot(8, 'si')).status).toBe(422);
  });

  it('lee y guarda los días de aviso de antigüedad', async () => {
    await getLotSettings();
    expect(spy).toHaveBeenCalledWith('/lots/settings');

    expect(normalizeAgeAlertDays('5')).toBe(5);
    expect(normalizeAgeAlertDays('0')).toBeNull();
    expect(normalizeAgeAlertDays('1.5')).toBeNull();

    const invalid = await updateLotSettings({ age_alert_days: '0' });
    expect(invalid.status).toBe(422);
    expect(spy).toHaveBeenCalledTimes(1);

    await updateLotSettings({ age_alert_days: '7' });
    expect(spy).toHaveBeenLastCalledWith('/lots/settings', {
      method: 'PUT',
      body: { age_alert_days: 7 },
    });
  });
});
