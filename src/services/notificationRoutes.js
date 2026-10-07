/**
 * Lista blanca de pantallas de navegación para avisos del motor.
 * Solo pantallas reconocidas en la PWA de Ualdo:
 * - 'inventario': pestaña Negocios, subvista Inventario.
 * - 'pedido' o 'pedidos': pestaña Asistente (los pedidos se consultan vía chat).
 * - 'cierre_caja': pestaña Negocios, subvista Caja (CashCloseView).
 * - 'chat': pestaña Asistente.
 */
export const ALLOWED_SCREENS = new Set([
  'inventario',
  'pedido',
  'pedidos',
  'cierre_caja',
  'chat',
]);

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valida y filtra los parámetros de una acción de aviso.
 * Solo se admiten enteros positivos o fechas YYYY-MM-DD.
 * NUNCA se permiten URLs ni cadenas arbitrarias.
 */
export const sanitizeActionParams = (params) => {
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return {};
  }

  const clean = {};
  for (const [key, val] of Object.entries(params)) {
    if (typeof val === 'number' && Number.isInteger(val) && val > 0) {
      clean[key] = val;
    } else if (typeof val === 'string') {
      const trimmed = val.trim();
      if (/^\d+$/.test(trimmed)) {
        clean[key] = parseInt(trimmed, 10);
      } else if (DATE_REGEX.test(trimmed)) {
        clean[key] = trimmed;
      }
    }
  }
  return clean;
};

/**
 * Resuelve el destino de navegación interna para la PWA a partir de una acción de aviso.
 * Devuelve null si la pantalla no está en la lista blanca o si no se debe navegar.
 *
 * @param {Object} action { screen, params }
 * @returns {{ tab: string, subView?: string, params?: Object } | null}
 */
export const resolveNotificationRoute = (action, explicitParams = {}) => {
  if (!action) {
    return null;
  }

  let screen = '';
  let rawParams = explicitParams;

  if (typeof action === 'string') {
    screen = action.trim().toLowerCase();
  } else if (typeof action === 'object') {
    screen = typeof action.screen === 'string' ? action.screen.trim().toLowerCase() : '';
    rawParams = action.params || explicitParams;
  }

  if (!ALLOWED_SCREENS.has(screen)) {
    return null;
  }

  const cleanParams = sanitizeActionParams(rawParams);

  switch (screen) {
    case 'inventario':
      return { tab: 'negocios', subView: 'inventory', params: cleanParams };

    case 'pedido':
    case 'pedidos':
      return { tab: 'asistente', params: cleanParams };

    case 'cierre_caja':
      return { tab: 'negocios', subView: 'cashclose', params: cleanParams };

    case 'chat':
      return { tab: 'asistente', params: cleanParams };

    default:
      return null;
  }
};
