/**
 * Permisos y roles del sistema Ualdo (Brief 30 / 30p).
 * Unica fuente de verdad para autorizacion en la app.
 */

export const ABILITIES = Object.freeze({
  TEAM_MANAGE: 'team.manage',
  SETTINGS_MANAGE: 'settings.manage',
  SUPPLY_REQUEST: 'supply.request',
  SUPPLY_DECIDE: 'supply.decide',
  PURCHASES_MANAGE: 'purchases.manage',
  PURCHASES_RECEIVE: 'purchases.receive',
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_MOVE: 'inventory.move',
  INVENTORY_COUNT_WAREHOUSE: 'inventory.count.warehouse',
  INVENTORY_COUNT_KITCHEN: 'inventory.count.kitchen',
  INVENTORY_COUNT_LOUNGE: 'inventory.count.lounge',
  INVENTORY_VALIDATE_KITCHEN: 'inventory.validate.kitchen',
  INVENTORY_VALIDATE_LOUNGE: 'inventory.validate.lounge',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_COSTS: 'inventory.costs',
  WITHDRAWALS_DECLARE: 'withdrawals.declare',
  WITHDRAWALS_SUPERVISE: 'withdrawals.supervise',
  PRODUCTION_REGISTER: 'production.register',
  CASH_REGISTER: 'cash.register',
  CASH_REVIEW: 'cash.review',
  SALES_TOTALS: 'sales.totals',
  OVERTIME_REGISTER_KITCHEN: 'overtime.register.kitchen',
  OVERTIME_REGISTER_LOUNGE: 'overtime.register.lounge',
  OVERTIME_REPORT: 'overtime.report',
  INCIDENTS_REPORT: 'incidents.report',
  INCIDENTS_MANAGE: 'incidents.manage',
  ASSETS_COUNT_KITCHEN: 'assets.count.kitchen',
  ASSETS_COUNT_LOUNGE: 'assets.count.lounge',
  ASSETS_VALIDATE_KITCHEN: 'assets.validate.kitchen',
  ASSETS_VALIDATE_LOUNGE: 'assets.validate.lounge',
  RESERVATIONS_VIEW: 'reservations.view',
  RESERVATIONS_MANAGE: 'reservations.manage',
  LOTS_MANAGE: 'lots.manage',
});

export const ROLES = Object.freeze({
  OWNER: 'owner',
  ADMIN: 'admin',
  KITCHEN_HEAD: 'kitchen_head',
  LOUNGE_HEAD: 'lounge_head',
  KITCHEN_STAFF: 'kitchen_staff',
  LOUNGE_STAFF: 'lounge_staff',
  STAFF: 'staff',
});

export const ROLE_LABELS = Object.freeze({
  owner: 'Dueño',
  admin: 'Administración',
  kitchen_head: 'Jefe de cocina',
  lounge_head: 'Jefe de salón',
  kitchen_staff: 'Cocina',
  lounge_staff: 'Salón',
  staff: 'Personal sin área',
});

export const AREA_LABELS = Object.freeze({
  kitchen: 'Cocina',
  lounge: 'Salón',
});

const FALLBACK_STAFF_ABILITIES = new Set([
  ABILITIES.SUPPLY_REQUEST,
  ABILITIES.INVENTORY_VIEW,
  ABILITIES.INVENTORY_MOVE,
  ABILITIES.WITHDRAWALS_DECLARE,
]);

/**
 * Determina si el usuario posee un permiso concreto.
 * Si capabilities.abilities existe como arreglo, se evalua contra el.
 * Respaldo motor viejo: dueño puede todo; personal solo 4 permisos basicos.
 *
 * @param {object|null} user
 * @param {string} ability
 * @returns {boolean}
 */
export function can(user, ability) {
  if (!user || !ability) return false;

  if (Array.isArray(user?.capabilities?.abilities)) {
    return user.capabilities.abilities.includes(ability);
  }

  const isOwner = Boolean(user?.capabilities?.is_owner || user?.role === 'owner');
  if (isOwner) {
    return true;
  }

  return FALLBACK_STAFF_ABILITIES.has(ability);
}

/**
 * Determina si el usuario posee al menos uno de los permisos dados.
 *
 * @param {object|null} user
 * @param {string[]} abilities
 * @returns {boolean}
 */
export function canAny(user, abilities = []) {
  if (!Array.isArray(abilities) || abilities.length === 0) return false;
  return abilities.some((ability) => can(user, ability));
}

/**
 * Devuelve la etiqueta en español del cargo del usuario.
 *
 * @param {object|null} user
 * @returns {string}
 */
export function roleLabel(user) {
  if (user?.capabilities?.role_label) {
    return user.capabilities.role_label;
  }
  const role = user?.capabilities?.role || user?.role;
  return ROLE_LABELS[role] || 'Personal';
}

/**
 * Devuelve el identificador de area del usuario ('kitchen', 'lounge' o null).
 *
 * @param {object|null} user
 * @returns {string|null}
 */
export function userArea(user) {
  if (user?.capabilities?.area !== undefined) {
    return user.capabilities.area;
  }
  const role = user?.capabilities?.role || user?.role;
  if (role === 'kitchen_head' || role === 'kitchen_staff') return 'kitchen';
  if (role === 'lounge_head' || role === 'lounge_staff') return 'lounge';
  return null;
}
