import { request } from './apiClient';
import { ROLES } from './permissions';

const VALID_ROLES = new Set(Object.values(ROLES));

/**
 * Consulta la lista de colaboradores del restaurante del negocio actual.
 *
 * @param {number} [page=1]
 * @returns {Promise<{ ok: boolean, status: number, data?: object, error?: string }>}
 */
export async function listTeam(page = 1) {
  const pageNum = Number.isInteger(page) && page > 0 ? page : 1;
  return request(`/team?page=${pageNum}`);
}

/**
 * Actualiza el cargo de un colaborador del restaurante.
 * Valida localmente el identificador y el cargo antes de enviar.
 *
 * @param {number|string} userId
 * @param {string} role
 * @returns {Promise<{ ok: boolean, status: number, data?: object, error?: string }>}
 */
export async function updateRole(userId, role) {
  const idStr = String(userId ?? '').trim();
  if (!/^\d+$/.test(idStr)) {
    return {
      ok: false,
      status: 400,
      error: 'Identificador de usuario inválido. Debe ser numérico.',
    };
  }

  if (typeof role !== 'string' || !VALID_ROLES.has(role)) {
    return {
      ok: false,
      status: 400,
      error: 'Cargo inválido. Debe ser uno de los siete cargos permitidos.',
    };
  }

  return request(`/team/${idStr}/role`, {
    method: 'PUT',
    body: { role },
  });
}
