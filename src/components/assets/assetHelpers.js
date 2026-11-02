import { can, ABILITIES } from '../../services/permissions';

export const ASSET_AREA_LABELS = Object.freeze({
  kitchen: 'Cocina',
  lounge: 'Salón',
});

/**
 * Devuelve la lista de áreas que el usuario puede contar o validar.
 *
 * @param {object|null} user
 * @returns {Array<'kitchen'|'lounge'>}
 */
export function getUserAssetAreas(user) {
  if (!user) return ['lounge'];

  const isOwner = Boolean(user?.capabilities?.is_owner || user?.role === 'owner');
  const isAdmin = user?.role === 'admin';
  const hasSettings = can(user, ABILITIES.SETTINGS_MANAGE);

  if (isOwner || isAdmin || hasSettings) {
    return ['lounge', 'kitchen'];
  }

  const canCountKitchen = can(user, ABILITIES.ASSETS_COUNT_KITCHEN);
  const canValKitchen = can(user, ABILITIES.ASSETS_VALIDATE_KITCHEN);
  const canCountLounge = can(user, ABILITIES.ASSETS_COUNT_LOUNGE);
  const canValLounge = can(user, ABILITIES.ASSETS_VALIDATE_LOUNGE);

  const areas = [];
  if (canCountLounge || canValLounge) {
    areas.push('lounge');
  }
  if (canCountKitchen || canValKitchen) {
    areas.push('kitchen');
  }

  return areas.length > 0 ? areas : ['lounge'];
}

/**
 * Comprueba si el usuario tiene permiso para validar el conteo de un área dada.
 *
 * @param {object|null} user
 * @param {'kitchen'|'lounge'} area
 * @returns {boolean}
 */
export function canValidateAssetArea(user, area) {
  if (!user) return false;
  const isOwner = Boolean(user?.capabilities?.is_owner || user?.role === 'owner');
  const isAdmin = user?.role === 'admin';
  if (isOwner || isAdmin) return true;

  if (area === 'kitchen') {
    return can(user, ABILITIES.ASSETS_VALIDATE_KITCHEN);
  }
  if (area === 'lounge') {
    return can(user, ABILITIES.ASSETS_VALIDATE_LOUNGE);
  }
  return false;
}

/**
 * Devuelve el periodo actual en formato 'YYYY-MM'.
 *
 * @returns {string}
 */
export function getCurrentPeriod() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Devuelve el periodo del mes anterior en formato 'YYYY-MM'.
 *
 * @returns {string}
 */
export function getPreviousPeriod() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Formatea un periodo 'YYYY-MM' en un texto legible en español.
 *
 * @param {string} period
 * @returns {string}
 */
export function formatPeriodLabel(period) {
  if (!period || typeof period !== 'string' || !/^\d{4}-\d{2}$/.test(period)) {
    return period || '';
  }
  const [year, month] = period.split('-');
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const idx = parseInt(month, 10) - 1;
  const monthName = months[idx] || month;
  return `${monthName} ${year}`;
}
