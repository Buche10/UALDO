import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import { listTeam, updateRole } from '../teamClient';
import { ROLES } from '../permissions';

describe('teamClient service (Brief 30p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('listTeam', () => {
    it('consulta GET /team?page=1 por defecto', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: [], meta: { current_page: 1, last_page: 1 } },
      });

      const res = await listTeam();
      expect(spy).toHaveBeenCalledWith('/team?page=1');
      expect(res.ok).toBe(true);
    });

    it('respeta la página especificada', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: [] },
      });

      await listTeam(3);
      expect(spy).toHaveBeenCalledWith('/team?page=3');
    });

    it('usa página 1 si se pasa un valor no entero o inválido', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: [] },
      });

      await listTeam('abc');
      expect(spy).toHaveBeenCalledWith('/team?page=1');
    });
  });

  describe('updateRole', () => {
    it('valida que el identificador sea numérico antes de enviar', async () => {
      const spy = vi.spyOn(apiClient, 'request');

      const res1 = await updateRole('abc', ROLES.ADMIN);
      expect(res1.ok).toBe(false);
      expect(res1.status).toBe(400);
      expect(res1.error).toContain('Identificador de usuario inválido');

      const res2 = await updateRole('', ROLES.ADMIN);
      expect(res2.ok).toBe(false);

      expect(spy).not.toHaveBeenCalled();
    });

    it('valida que el cargo pertenezca a la lista cerrada de siete roles', async () => {
      const spy = vi.spyOn(apiClient, 'request');

      const res = await updateRole(12, 'superadmin');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(res.error).toContain('Cargo inválido');
      expect(spy).not.toHaveBeenCalled();
    });

    it('envía PUT /team/{userId}/role con body { role } ante datos válidos', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: { id: 15, role: ROLES.KITCHEN_HEAD } },
      });

      const res = await updateRole(15, ROLES.KITCHEN_HEAD);
      expect(spy).toHaveBeenCalledWith('/team/15/role', {
        method: 'PUT',
        body: { role: ROLES.KITCHEN_HEAD },
      });
      expect(res.ok).toBe(true);
    });

    it('propaga el error 422 del motor si se intenta degradar al último dueño', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: false,
        status: 422,
        error: 'El negocio debe tener al menos un dueño.',
        data: {
          message: 'El negocio debe tener al menos un dueño.',
          errors: { role: ['El negocio debe tener al menos un dueño.'] },
        },
      });

      const res = await updateRole(1, ROLES.ADMIN);
      expect(res.ok).toBe(false);
      expect(res.status).toBe(422);
      expect(res.error).toBe('El negocio debe tener al menos un dueño.');
    });
  });
});
