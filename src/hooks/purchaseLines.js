/**
 * Reglas puras de las líneas de una compra en edición (Brief 20p). Cada línea
 * lleva una clave local estable (el id del insumo), el insumo elegido y los
 * textos escritos. Los montos nunca se suman aquí: el total lo da el motor.
 */

export const lineKey = (itemId) => `line:${itemId}`;

/** Líneas editables a partir de las de una compra del motor. */
export function linesFromPurchase(purchase) {
  return (purchase?.lines || []).map((line) => ({
    key: lineKey(line.item_id),
    item: { id: line.item_id, name: line.item_name, unit: line.unit },
    quantity: line.quantity === null || line.quantity === undefined ? '' : String(line.quantity),
    line_total: line.line_total === null || line.line_total === undefined ? '' : String(line.line_total),
    note: line.note || '',
  }));
}

/** Agrega un insumo si no está ya en la compra. */
export function addItem(lines, item) {
  if (!item?.id || lines.some((line) => line.item.id === item.id)) return lines;
  return [...lines, { key: lineKey(item.id), item: { id: item.id, name: item.name, unit: item.unit }, quantity: '', line_total: '', note: '' }];
}

export function updateLine(lines, key, field, value) {
  return lines.map((line) => (line.key === key ? { ...line, [field]: value } : line));
}

export function removeLine(lines, key) {
  return lines.filter((line) => line.key !== key);
}

/** Líneas para el cliente: insumo, cantidad, total pagado y nota, como texto. */
export function toPayloadLines(lines) {
  return lines.map((line) => ({ item_id: line.item.id, quantity: line.quantity, line_total: line.line_total, note: line.note }));
}

/**
 * Traduce errores con claves del motor (`lines.N.campo`) a la clave local de la
 * línea N enviada: `{ 'line:31': { quantity: 'mensaje' } }`. El resto queda en
 * `general`.
 */
export function mapLineErrors(errors, lines) {
  const byLine = {};
  const general = {};
  Object.keys(errors || {}).forEach((key) => {
    const message = Array.isArray(errors[key]) ? errors[key].join(' ') : String(errors[key]);
    const match = key.match(/^lines\.(\d+)\.(\w+)$/);
    const line = match ? lines[Number(match[1])] : null;
    if (line) {
      byLine[line.key] = { ...(byLine[line.key] || {}), [match[2]]: message };
    } else {
      general[match ? 'lines' : key] = general[match ? 'lines' : key] || message;
    }
  });
  return { byLine, general };
}
