import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import { getOpenTables, normalizeOpenTables, OPEN_TABLES_FORBIDDEN_MESSAGE } from '../openTablesClient';

const rawWithAmounts = {
  capturada_en: '2026-11-09T21:40:12-05:00',
  desactualizado: false,
  minutos_desde_foto: 3,
  mostrar_montos: true,
  resumen: {
    mesas: 1,
    total: '45.60',
    pendiente: '45.60',
    con_precuenta: 1,
    mas_antigua_desde: '2026-11-09T20:05:00-05:00'
  },
  mesas: [
    {
      pedido_id: 123456,
      mesa: '4',
      grupo: 'SALON',
      etiqueta: 'Mesa 4 (SALON)',
      pax: 4,
      mesero: 'Juan',
      abierta_desde: '2026-11-09T20:05:00-05:00',
      minutos_abierta: 95,
      de_dia_anterior: false,
      precuenta: true,
      total: '45.60',
      facturado: '0.00',
      pendiente: '45.60'
    }
  ]
};

describe('openTablesClient (Brief 47p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('consulta la ruta correcta del motor y devuelve la respuesta normalizada', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, status: 200, data: rawWithAmounts });

    const res = await getOpenTables();

    expect(apiClient.request).toHaveBeenCalledWith('/restaurant/open-tables');
    expect(res.ok).toBe(true);
    expect(res.data.mostrar_montos).toBe(true);
    expect(res.data.mesas).toHaveLength(1);
    expect(res.data.mesas[0].etiqueta).toBe('Mesa 4 (SALON)');
    expect(res.data.mesas[0].pendiente).toBe('45.60');
    expect(res.data.resumen.pendiente).toBe('45.60');
  });

  it('devuelve lista vacía cuando la respuesta no trae mesas', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { capturada_en: null, mostrar_montos: false }
    });

    const res = await getOpenTables();

    expect(res.data.mesas).toEqual([]);
    expect(res.data.resumen).toEqual({});
    expect(res.data.desactualizado).toBe(false);
  });

  it('no inventa montos cuando el motor los omite', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        capturada_en: '2026-11-09T21:40:12-05:00',
        desactualizado: false,
        minutos_desde_foto: 3,
        mostrar_montos: false,
        resumen: {
          mesas: 1,
          con_precuenta: 0,
          mas_antigua_desde: '2026-11-09T20:05:00-05:00'
        },
        mesas: [
          {
            pedido_id: 9,
            mesa: '2',
            etiqueta: 'Mesa 2',
            pax: 2,
            mesero: 'Ana',
            abierta_desde: '2026-11-09T20:05:00-05:00',
            minutos_abierta: 95,
            de_dia_anterior: false,
            precuenta: false
          }
        ]
      }
    });

    const res = await getOpenTables();
    const mesa = res.data.mesas[0];

    expect(res.data.mostrar_montos).toBe(false);
    expect(res.data.resumen).not.toHaveProperty('total');
    expect(res.data.resumen).not.toHaveProperty('pendiente');
    expect(mesa).not.toHaveProperty('total');
    expect(mesa).not.toHaveProperty('facturado');
    expect(mesa).not.toHaveProperty('pendiente');
  });

  it('traduce el 403 del motor a un mensaje claro', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      ok: false,
      status: 403,
      error: 'Forbidden'
    });

    const res = await getOpenTables();

    expect(res.ok).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toBe(OPEN_TABLES_FORBIDDEN_MESSAGE);
  });

  it('propaga otros errores del motor sin normalizar datos', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Error del servidor'
    });

    const res = await getOpenTables();

    expect(res).toEqual({ ok: false, status: 500, error: 'Error del servidor' });
  });

  it('normaliza datos nulos sin lanzar errores', () => {
    const normalized = normalizeOpenTables(null);

    expect(normalized.capturada_en).toBeNull();
    expect(normalized.mesas).toEqual([]);
    expect(normalized.mostrar_montos).toBe(false);
    expect(normalized.resumen).toEqual({});
  });
});
