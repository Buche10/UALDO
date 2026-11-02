import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as engine from '../doblefiloEngine';
import { clearStoredTables, getDoblefiloMenu } from '../doblefiloEngine';

describe('doblefiloEngine sin datos falsos (Brief 41p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('borra la clave de mesas guardada por versiones anteriores', () => {
    localStorage.setItem('ualdo_doblefilo_tables', JSON.stringify([{ id: 'M-01' }]));

    clearStoredTables();

    expect(localStorage.getItem('ualdo_doblefilo_tables')).toBeNull();
  });

  it('no exporta mesas de ejemplo ni funciones de respaldo', () => {
    expect(engine.getDoblefiloTables).toBeUndefined();
    expect(engine.getStoredTables).toBeUndefined();
    expect(engine.saveStoredTables).toBeUndefined();
    expect(engine.getDoblefiloDailySummary).toBeUndefined();
  });

  it('devuelve el menú real de RunFood cuando responde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        { id: 1, codigo: 'A1', descripcion: 'Bife', habilitado: true, pvp: 10, pagaIva: false },
      ]),
    }));

    const result = await getDoblefiloMenu();

    expect(result.success).toBe(true);
    expect(result.source).toBe('runfood');
    expect(result.menu).toHaveLength(1);
    vi.unstubAllGlobals();
  });

  it('si RunFood falla devuelve un error sin menú de ejemplo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')));

    const result = await getDoblefiloMenu();

    expect(result.success).toBe(false);
    expect(result.menu).toEqual([]);
    expect(result.source).not.toBe('mock');
    vi.unstubAllGlobals();
  });
});
