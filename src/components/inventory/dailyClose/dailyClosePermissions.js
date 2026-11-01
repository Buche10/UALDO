import { can, ABILITIES } from '../../../services/permissions';

/**
 * Determina si el usuario puede realizar el conteo físico en la ubicación dada.
 */
export function canCountLocation(user, location) {
  if (!user) return false;
  if (location === 'kitchen') return can(user, ABILITIES.INVENTORY_COUNT_KITCHEN);
  if (location === 'lounge') return can(user, ABILITIES.INVENTORY_COUNT_LOUNGE);
  if (location === 'warehouse') return can(user, ABILITIES.INVENTORY_COUNT_WAREHOUSE);
  return false;
}

/**
 * Determina si el usuario puede validar el conteo de la ubicación dada.
 * Si el conteo está escalado, solo quien tiene inventory.adjust puede validarlo.
 */
export function canValidateLocation(user, location, status) {
  if (!user) return false;
  if (status === 'escalated') {
    return can(user, ABILITIES.INVENTORY_ADJUST);
  }
  if (can(user, ABILITIES.INVENTORY_ADJUST)) return true;
  if (location === 'kitchen') return can(user, ABILITIES.INVENTORY_VALIDATE_KITCHEN);
  if (location === 'lounge') return can(user, ABILITIES.INVENTORY_VALIDATE_LOUNGE);
  return false;
}
