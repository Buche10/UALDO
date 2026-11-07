import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  listActivity,
  listActivityPeople,
  isValidActivityDateRange,
  ALLOWED_ACTIVITY_MODULES,
} from '../activityClient';

describe('activityClient (Brief 46p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('validaciones locales de fecha y rango', () => {
    it('valida rangos menores o iguales a 93 días', () => {
      expect(isValidActivityDateRange('2026-10-01', '2026-10-07')).toBe(true);
      expect(isValidActivityDateRange('2026-08-01', '2026-11-02')).toBe(true);
      expect(isValidActivityDateRange('2026-01-01', '2026-06-01')).toBe(false);
      expect(isValidActivityDateRange('2026-11-06', '2026-11-01')).toBe(false);
    });

    it('rechaza fecha inicial posterior a la final', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await listActivity({
        desde: '2026-11-10',
        hasta: '2026-11-01',
      });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(res.error).toContain('no puede ser posterior');
      expect(spy).not.toHaveBeenCalled();
    });

    it('rechaza rango mayor a 93 días sin llamar al backend', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await listActivity({
        desde: '2026-01-01',
        hasta: '2026-05-01',
      });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(res.error).toContain('93 días');
      expect(spy).not.toHaveBeenCalled();
    });

    it('rechaza módulo no permitido', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      const res = await listActivity({
        modulo: 'modulo_inexistente',
      });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(res.error).toContain('Módulo de actividad no permitido');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('listActivity', () => {
    it('construye la URL y parámetros correctamente', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: [], meta: { current_page: 1, last_page: 1 } },
      });

      const res = await listActivity({
        modulo: 'inventario',
        usuarioId: 5,
        desde: '2026-11-01',
        hasta: '2026-11-06',
        page: 2,
      });

      expect(spy).toHaveBeenCalledWith(
        '/activity?modulo=inventario&usuario_id=5&desde=2026-11-01&hasta=2026-11-06&page=2'
      );
      expect(res.ok).toBe(true);
    });
  });

  describe('listActivityPeople', () => {
    it('desenvuelve lista de personas', async () => {
      const mockPeople = [
        { id: 1, nombre: 'Ana Dueña', cargo_label: 'Dueño' },
        { id: 2, nombre: 'Carlos Salón', cargo_label: 'Jefe de salón' },
      ];
      vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: mockPeople },
      });

      const res = await listActivityPeople();
      expect(res.ok).toBe(true);
      expect(res.data).toEqual(mockPeople);
    });
  });
});
