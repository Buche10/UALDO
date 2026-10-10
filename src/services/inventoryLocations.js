/**
 * Catálogo canónico de ubicaciones de inventario y funciones auxiliares.
 * Basado en la especificación del Brief 19 del motor (UaldoBusiness).
 */

export const INVENTORY_LOCATIONS = Object.freeze([
  { value: 'warehouse', label: 'Bodega' },
  { value: 'kitchen', label: 'Cocina' },
  { value: 'lounge', label: 'Salón' },
]);

export const DEFAULT_LOCATION = 'kitchen';

const VALID_SET = new Set(INVENTORY_LOCATIONS.map((loc) => loc.value));
const LABEL_MAP = new Map(INVENTORY_LOCATIONS.map((loc) => [loc.value, loc.label]));

/**
 * Valida si un valor corresponde a una ubicación permitida.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidLocation(value) {
  return typeof value === 'string' && VALID_SET.has(value.trim());
}

/**
 * Devuelve la etiqueta legible en español de una ubicación.
 * Para valores nulos o indefinidos (movimientos anteriores al Brief 19) devuelve "Sin ubicación".
 * @param {unknown} value
 * @returns {string}
 */
export function locationLabel(value) {
  if (value === null || value === undefined || value === '') {
    return 'Sin ubicación';
  }
  const str = String(value).trim();
  return LABEL_MAP.get(str) || 'Sin ubicación';
}
