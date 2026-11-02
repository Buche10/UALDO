/**
 * Reglas compartidas de selección de lote (Brief 40p). Viven fuera de los
 * componentes para que formularios y selector validen igual.
 */

export const LOT_REASON_MIN = 5;
export const LOT_REASON_MAX = 300;

/** Texto del motivo de un salto de FIFO, sin espacios sobrantes. */
export function normalizeLotJustification(raw) {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (value.length < LOT_REASON_MIN || value.length > LOT_REASON_MAX) return null;
  return value;
}

/** Selección inicial de un selector de lote. */
export function emptyLotSelection() {
  return {
    lotId: '',
    justification: '',
    needsJustification: false,
    recommendedCode: null,
    recommendedLotId: null,
  };
}

/**
 * Motivo que debe mostrar el selector cuando se elige un lote distinto al
 * recomendado. Es el texto exacto del Brief 40p.
 */
export function lotJustificationPrompt(recommendedCode, chosenCode) {
  return `Hay un lote más antiguo (${recommendedCode}). ¿Por qué usas ${chosenCode}?`;
}

/**
 * Error de validación de la selección, o null si se puede continuar.
 * El motivo solo es obligatorio cuando se salta el lote recomendado.
 */
export function lotSelectionError(selection) {
  if (!selection) return null;
  if (!selection.needsJustification) return null;
  if (!selection.lotId) return 'Elige el lote que vas a usar.';
  if (!normalizeLotJustification(selection.justification)) {
    return `Indica el motivo para usar otro lote (${LOT_REASON_MIN} a ${LOT_REASON_MAX} caracteres).`;
  }
  return null;
}

/** Campos `lot_id` y `justification` que viajan al motor, solo si aplican. */
export function lotPayloadFields(selection) {
  const fields = {};
  if (!selection || !selection.lotId) return fields;
  const lotId = Number(selection.lotId);
  if (!Number.isInteger(lotId) || lotId <= 0) return fields;
  fields.lot_id = lotId;
  if (selection.needsJustification) {
    const justification = normalizeLotJustification(selection.justification);
    if (justification) fields.justification = justification;
  }
  return fields;
}
