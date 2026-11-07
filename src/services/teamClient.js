import { request } from './apiClient';
import { ROLES } from './permissions';

const VALID_ROLES = new Set(Object.values(ROLES));
const VALID_STATES = new Set(['activos', 'inactivos', 'todos']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ID_ERROR = 'Identificador de usuario inválido. Debe ser numérico.';
const ROLE_ERROR = 'Cargo inválido. Debe ser uno de los cargos permitidos.';
const NAME_ERROR = 'El nombre debe tener entre 2 y 80 caracteres.';
const EMAIL_ERROR = 'El correo no tiene un formato válido.';

const invalid = (error) => ({ ok: false, status: 400, error });

const normalizeId = (userId) => {
  const idStr = String(userId ?? '').trim();
  return /^\d+$/.test(idStr) ? idStr : null;
};

const isValidRole = (role) => typeof role === 'string' && VALID_ROLES.has(role);

/**
 * Consulta la lista de colaboradores del restaurante del negocio actual.
 *
 * @param {number} [page=1]
 * @param {'activos'|'inactivos'|'todos'} [estado]
 * @returns {Promise<{ ok: boolean, status: number, data?: object, error?: string }>}
 */
export async function listTeam(page = 1, estado) {
  const pageNum = Number.isInteger(page) && page > 0 ? page : 1;
  const params = [`page=${pageNum}`];

  if (estado !== undefined && estado !== null) {
    params.push(`estado=${VALID_STATES.has(estado) ? estado : 'todos'}`);
  }

  return request(`/team?${params.join('&')}`);
}

/**
 * Crea una cuenta para una persona del equipo. El motor devuelve la
 * contraseña temporal una sola vez junto con el usuario creado.
 *
 * @param {{ name: string, email: string, role: string }} member
 * @returns {Promise<{ ok: boolean, status: number, data?: object, error?: string }>}
 */
export async function createMember({ name, email, role } = {}) {
  const cleanName = typeof name === 'string' ? name.trim() : '';
  if (cleanName.length < 2 || cleanName.length > 80) {
    return invalid(NAME_ERROR);
  }

  const cleanEmail = typeof email === 'string' ? email.trim() : '';
  if (!EMAIL_PATTERN.test(cleanEmail)) {
    return invalid(EMAIL_ERROR);
  }

  if (!isValidRole(role)) {
    return invalid(ROLE_ERROR);
  }

  return request('/team', {
    method: 'POST',
    body: { name: cleanName, email: cleanEmail, role },
  });
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
  const idStr = normalizeId(userId);
  if (!idStr) {
    return invalid(ID_ERROR);
  }

  if (!isValidRole(role)) {
    return invalid(ROLE_ERROR);
  }

  return request(`/team/${idStr}/role`, {
    method: 'PUT',
    body: { role },
  });
}

/**
 * Desactiva una cuenta para que la persona no pueda volver a entrar.
 *
 * @param {number|string} userId
 * @returns {Promise<{ ok: boolean, status: number, data?: object, error?: string }>}
 */
export async function deactivateMember(userId) {
  const idStr = normalizeId(userId);
  if (!idStr) return invalid(ID_ERROR);

  return request(`/team/${idStr}/deactivate`, { method: 'POST' });
}

/**
 * Reactiva una cuenta desactivada del equipo.
 *
 * @param {number|string} userId
 * @returns {Promise<{ ok: boolean, status: number, data?: object, error?: string }>}
 */
export async function reactivateMember(userId) {
  const idStr = normalizeId(userId);
  if (!idStr) return invalid(ID_ERROR);

  return request(`/team/${idStr}/reactivate`, { method: 'POST' });
}

/**
 * Restablece la contraseña de una persona del equipo. El motor devuelve
 * una contraseña temporal nueva una sola vez.
 *
 * @param {number|string} userId
 * @returns {Promise<{ ok: boolean, status: number, data?: object, error?: string }>}
 */
export async function resetMemberPassword(userId) {
  const idStr = normalizeId(userId);
  if (!idStr) return invalid(ID_ERROR);

  return request(`/team/${idStr}/reset-password`, { method: 'POST' });
}
