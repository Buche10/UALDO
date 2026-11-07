import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import { listTeam, updateRole, createMember, deactivateMember, reactivateMember, resetMemberPassword } from '../teamClient';
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

    it('valida que el cargo pertenezca a la lista cerrada de cargos', async () => {
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

  describe('listTeam con estado (Brief 45p)', () => {
    it('añade estado activos, inactivos o todos a la consulta', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, status: 200, data: { data: [] } });

      await listTeam(2, 'inactivos');
      expect(spy).toHaveBeenCalledWith('/team?page=2&estado=inactivos');

      await listTeam(1, 'todos');
      expect(spy).toHaveBeenCalledWith('/team?page=1&estado=todos');
    });

    it('normaliza un estado desconocido a todos', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, status: 200, data: { data: [] } });

      await listTeam(1, 'otro');
      expect(spy).toHaveBeenCalledWith('/team?page=1&estado=todos');
    });
  });

  describe('createMember (Brief 45p)', () => {
    it('valida el nombre entre 2 y 80 caracteres', async () => {
      const spy = vi.spyOn(apiClient, 'request');

      const shortName = await createMember({ name: 'A', email: 'ana@rest.com', role: ROLES.LOUNGE_STAFF });
      expect(shortName.ok).toBe(false);
      expect(shortName.error).toContain('entre 2 y 80');

      const longName = await createMember({ name: 'A'.repeat(81), email: 'ana@rest.com', role: ROLES.LOUNGE_STAFF });
      expect(longName.ok).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });

    it('valida el correo y el cargo antes de enviar', async () => {
      const spy = vi.spyOn(apiClient, 'request');

      const badEmail = await createMember({ name: 'Ana', email: 'sin-arroba', role: ROLES.LOUNGE_STAFF });
      expect(badEmail.ok).toBe(false);
      expect(badEmail.error).toContain('correo');

      const badRole = await createMember({ name: 'Ana', email: 'ana@rest.com', role: 'superadmin' });
      expect(badRole.ok).toBe(false);
      expect(badRole.error).toContain('Cargo inválido');
      expect(badRole.error).not.toContain('siete');
      expect(spy).not.toHaveBeenCalled();
    });

    it('envía POST /team con nombre y correo limpios', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 201,
        data: { data: { id: 21, name: 'Ana' }, temporary_password: 'Temp1234' },
      });

      const res = await createMember({ name: '  Ana  ', email: ' ana@rest.com ', role: ROLES.LOUNGE_STAFF });
      expect(spy).toHaveBeenCalledWith('/team', {
        method: 'POST',
        body: { name: 'Ana', email: 'ana@rest.com', role: ROLES.LOUNGE_STAFF },
      });
      expect(res.ok).toBe(true);
      expect(res.data.temporary_password).toBe('Temp1234');
    });
  });

  describe('acciones de cuenta (Brief 45p)', () => {
    it('valida identificadores no numéricos sin llamar al motor', async () => {
      const spy = vi.spyOn(apiClient, 'request');

      const results = await Promise.all([
        deactivateMember('abc'),
        reactivateMember(''),
        resetMemberPassword(null),
      ]);

      results.forEach((res) => {
        expect(res.ok).toBe(false);
        expect(res.status).toBe(400);
        expect(res.error).toContain('Identificador de usuario inválido');
      });
      expect(spy).not.toHaveBeenCalled();
    });

    it('usa POST en las rutas de desactivar, reactivar y restablecer', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, status: 200, data: { data: {} } });

      await deactivateMember(15);
      expect(spy).toHaveBeenCalledWith('/team/15/deactivate', { method: 'POST' });

      await reactivateMember(15);
      expect(spy).toHaveBeenCalledWith('/team/15/reactivate', { method: 'POST' });

      await resetMemberPassword(15);
      expect(spy).toHaveBeenCalledWith('/team/15/reset-password', { method: 'POST' });
    });

    it('propaga el 422 del último dueño tal cual', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: false,
        status: 422,
        error: 'El negocio debe tener al menos un dueño.',
        data: { message: 'El negocio debe tener al menos un dueño.' },
      });

      const res = await deactivateMember(1);
      expect(res.ok).toBe(false);
      expect(res.status).toBe(422);
      expect(res.error).toBe('El negocio debe tener al menos un dueño.');
    });
  });
});
