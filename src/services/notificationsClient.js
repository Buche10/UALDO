import { request } from './apiClient';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Valida si un string es un UUID estándar.
 */
export const isValidUuid = (id) => {
  return typeof id === 'string' && UUID_REGEX.test(id.trim());
};

/**
 * Consulta la lista paginada de avisos.
 * params: { unread: 1, category: string, page: number }
 */
export const listNotifications = async ({ unread = null, category = '', page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (unread) {
    params.set('unread', '1');
  }
  if (category && typeof category === 'string' && category.trim()) {
    params.set('category', category.trim());
  }
  if (page && Number.isInteger(Number(page)) && Number(page) > 1) {
    params.set('page', String(page));
  }

  const qs = params.toString();
  const path = qs ? `/notifications?${qs}` : '/notifications';
  return request(path);
};

/**
 * Consulta el conteo de avisos sin leer para la insignia de la app.
 */
export const getUnreadCount = async () => {
  return request('/notifications/unread-count');
};

/**
 * Marca un aviso específico como leído por su UUID.
 */
export const markRead = async (id) => {
  if (!isValidUuid(id)) {
    return {
      ok: false,
      status: 400,
      error: 'Identificador de aviso inválido.',
      isNetworkError: false,
    };
  }

  return request(`/notifications/${id.trim()}/read`, {
    method: 'POST',
  });
};

/**
 * Marca todos los avisos como leídos, opcionalmente acotado a una categoría.
 */
export const markAllRead = async (category = null) => {
  const options = {
    method: 'POST',
  };
  if (category && typeof category === 'string' && category.trim()) {
    options.body = { category: category.trim() };
  }
  return request('/notifications/read-all', options);
};

const VALID_CATEGORIES = new Set(['pedidos', 'inventario', 'caja', 'sistema']);

/**
 * Consulta las preferencias de categorías de avisos del usuario.
 */
export const getPreferences = async () => {
  return request('/notifications/preferences');
};

/**
 * Actualiza las preferencias de categorías del usuario.
 * Exige una lista: [{ category: 'pedidos'|'inventario'|'caja'|'sistema', enabled: boolean }]
 */
export const updatePreferences = async (preferences) => {
  if (!Array.isArray(preferences) || preferences.length === 0) {
    return {
      ok: false,
      status: 422,
      error: 'La lista de preferencias es requerida.',
      isNetworkError: false,
    };
  }

  const isValid = preferences.every(
    item => item && typeof item === 'object' &&
      VALID_CATEGORIES.has(item.category) &&
      typeof item.enabled === 'boolean'
  );

  if (!isValid) {
    return {
      ok: false,
      status: 422,
      error: 'Categoría o valor de activación inválido.',
      isNetworkError: false,
    };
  }

  return request('/notifications/preferences', {
    method: 'PUT',
    body: { preferences },
  });
};
