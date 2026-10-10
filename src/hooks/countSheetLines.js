/**
 * Reglas de las líneas de la planilla de conteo (Brief 19p_fix2).
 *
 * Cada entrada guarda lo que el dueño escribió (`counted_quantity`) y lo último
 * guardado en el motor (`initial_saved_qty`). Una línea está pendiente solo si
 * su valor difiere de lo guardado y no está en blanco: el motor no permite
 * quitar una línea, así que dejar en blanco una cantidad guardada no la borra.
 */

const COUNT_FORMAT = /^\d{1,7}(\.\d{1,3})?$/;
const MAX_COUNT = 1000000;

export const FORMAT_ERROR = 'Usa solo números, con 3 decimales como máximo.';
export const MAX_ERROR = 'La cantidad no puede superar 1.000.000.';

/** Texto normalizado: sin espacios y con punto decimal; '' si no hay valor. */
export function normalizeCountValue(raw) {
  if (raw === null || raw === undefined) return '';
  return String(raw).trim().replace(/,/g, '.');
}

/** Mensaje de error de una cantidad ya normalizada, o null si es válida o está en blanco. */
export function countValueError(normalized) {
  if (normalized === '') return null;
  if (!COUNT_FORMAT.test(normalized)) return FORMAT_ERROR;
  if (Number(normalized) > MAX_COUNT) return MAX_ERROR;
  return null;
}

/** La línea tiene un cambio por enviar (válido o no). */
export function isLineDirty(entry) {
  if (!entry) return false;
  const current = normalizeCountValue(entry.counted_quantity);
  return current !== '' && current !== normalizeCountValue(entry.initial_saved_qty);
}

/** El campo está en blanco pero el motor ya tiene una cantidad guardada. */
export function isBlankOverSaved(entry) {
  if (!entry) return false;
  return normalizeCountValue(entry.counted_quantity) === '' && normalizeCountValue(entry.initial_saved_qty) !== '';
}

/** El insumo cuenta como contado al aplicar: hay algo guardado o un cambio válido por guardar. */
export function isLineCounted(entry) {
  if (!entry) return false;
  const current = normalizeCountValue(entry.counted_quantity);
  const saved = normalizeCountValue(entry.initial_saved_qty);
  return saved !== '' || (current !== '' && countValueError(current) === null);
}

/** Entrada nueva con el valor escrito y su estado de pendiente recalculado. */
export function withValue(entry, value) {
  const base = entry || { counted_quantity: '', initial_saved_qty: '' };
  const next = { ...base, counted_quantity: value };
  return { ...next, isDirty: isLineDirty(next) };
}

/**
 * Separa las líneas pendientes en las que se pueden enviar y las inválidas.
 * @returns {{ dirtyEntries: Array, sentMap: Map, invalid: Object }}
 */
export function collectDirtyLines(currentMap) {
  const dirtyEntries = [];
  const sentMap = new Map();
  const invalid = {};
  Object.keys(currentMap).forEach((idStr) => {
    const entry = currentMap[idStr];
    if (!isLineDirty(entry)) return;
    const id = parseInt(idStr, 10);
    const value = normalizeCountValue(entry.counted_quantity);
    const error = countValueError(value);
    if (error) {
      invalid[id] = [error];
      return;
    }
    dirtyEntries.push({ item_id: id, counted_quantity: value });
    sentMap.set(id, value);
  });
  return { dirtyEntries, sentMap, invalid };
}

/**
 * Marca como guardadas las líneas enviadas que no cambiaron durante el
 * guardado. Una línea editada mientras se guardaba sigue pendiente.
 * @returns {Object} El mapa nuevo.
 */
export function markSaved(currentMap, sentMap) {
  const next = { ...currentMap };
  sentMap.forEach((sentValue, itemId) => {
    const current = next[itemId];
    if (current && normalizeCountValue(current.counted_quantity) === sentValue) {
      next[itemId] = { ...current, initial_saved_qty: sentValue, isDirty: false };
    }
  });
  return next;
}

/** Ids de las líneas pendientes. */
export function dirtyItemIds(currentMap) {
  return Object.keys(currentMap).filter((id) => isLineDirty(currentMap[id])).map(Number);
}
