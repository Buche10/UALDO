/**
 * Reglas puras de las líneas de un pedido interno en edición (Brief 22p).
 * Una línea es del catálogo (`catalog`, con el insumo elegido) o en texto
 * libre (`free`, con nombre y unidad). Cada una tiene una clave local estable.
 */

export const catalogKey = (itemId) => `cat:${itemId}`;

/** Agrega un insumo del catálogo si no está ya en el pedido. */
export function addCatalogItem(items, item) {
  if (!item?.id || items.some((line) => line.key === catalogKey(item.id))) return items;
  return [...items, { key: catalogKey(item.id), kind: 'catalog', itemId: item.id, name: item.name, unit: item.unit || '', quantity: '', note: '' }];
}

/** Agrega una línea en texto libre con una clave nueva. */
export function addFreeItem(items, sequence) {
  return [...items, { key: `free:${sequence}`, kind: 'free', itemId: null, name: '', unit: 'unidad', quantity: '', note: '' }];
}

export function updateItem(items, key, field, value) {
  return items.map((line) => (line.key === key ? { ...line, [field]: value } : line));
}

export function removeItem(items, key) {
  return items.filter((line) => line.key !== key);
}

/** Líneas para el cliente, con los nombres de campo del motor. */
export function toPayloadItems(items) {
  return items.map((line) => (line.kind === 'catalog'
    ? { inventory_item_id: line.itemId, quantity: line.quantity, note: line.note }
    : { free_text_name: line.name, unit: line.unit, quantity: line.quantity, note: line.note }));
}

/**
 * Traduce errores `items.N.campo` a la clave local de la línea N enviada. El
 * nombre libre del motor (`free_text_name`) queda como `name`.
 */
export function mapItemErrors(errors, items) {
  const byItem = {};
  const general = {};
  Object.keys(errors || {}).forEach((key) => {
    const message = Array.isArray(errors[key]) ? errors[key].join(' ') : String(errors[key]);
    const match = key.match(/^items\.(\d+)\.(\w+)$/);
    const line = match ? items[Number(match[1])] : null;
    if (line) {
      const field = match[2] === 'free_text_name' ? 'name' : match[2];
      byItem[line.key] = { ...(byItem[line.key] || {}), [field]: message };
    } else {
      const target = match ? 'items' : key;
      general[target] = general[target] || message;
    }
  });
  return { byItem, general };
}
