/**
 * Reglas puras de las líneas de una compra en edición (Brief 20p / Brief 33p). Cada línea
 * lleva una clave local estable, los datos del insumo o compra libre y los
 * textos escritos. Los montos nunca se suman aquí: el total lo da el motor.
 */

export const lineKey = (itemId) => `line:${itemId}`;

/** Líneas editables a partir de las de una compra del motor. */
export function linesFromPurchase(purchase) {
  return (purchase?.lines || []).map((line) => {
    if (line.is_other) {
      return {
        key: `other:${line.id || Math.random().toString(36).slice(2, 7)}`,
        is_other: true,
        free_text_name: line.item_name || line.free_text_name || '',
        unit: line.unit || 'unidad',
        quantity: line.quantity === null || line.quantity === undefined ? '' : String(line.quantity),
        line_total: line.line_total === null || line.line_total === undefined ? '' : String(line.line_total),
        note: line.note || '',
      };
    }
    return {
      key: lineKey(line.item_id),
      item: { id: line.item_id, name: line.item_name, unit: line.unit },
      quantity: line.quantity === null || line.quantity === undefined ? '' : String(line.quantity),
      line_total: line.line_total === null || line.line_total === undefined ? '' : String(line.line_total),
      note: line.note || '',
    };
  });
}

/** Agrega un insumo del catálogo si no está ya en la compra. */
export function addItem(lines, item) {
  if (!item?.id || lines.some((line) => !line.is_other && line.item?.id === item.id)) return lines;
  return [...lines, { key: lineKey(item.id), item: { id: item.id, name: item.name, unit: item.unit }, quantity: '', line_total: '', note: '' }];
}

/** Agrega una línea de "Otras compras" fuera del catálogo. */
export function addOtherLine(lines) {
  const key = `other:${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return [
    ...lines,
    {
      key,
      is_other: true,
      free_text_name: '',
      unit: 'unidad',
      quantity: '',
      line_total: '',
      note: '',
    },
  ];
}

export function updateLine(lines, key, field, value) {
  return lines.map((line) => (line.key === key ? { ...line, [field]: value } : line));
}

export function removeLine(lines, key) {
  return lines.filter((line) => line.key !== key);
}

/** Líneas para el cliente: insumo o libre, cantidad, total pagado y nota, como texto. */
export function toPayloadLines(lines) {
  return lines.map((line) => {
    if (line.is_other) {
      return {
        is_other: true,
        free_text_name: line.free_text_name || '',
        name: line.free_text_name || '',
        unit: line.unit || 'unidad',
        quantity: line.quantity,
        line_total: line.line_total,
        note: line.note,
      };
    }
    return {
      item_id: line.item?.id,
      quantity: line.quantity,
      line_total: line.line_total,
      note: line.note,
    };
  });
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
