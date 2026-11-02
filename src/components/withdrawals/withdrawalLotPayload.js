import { lotPayloadFields, lotSelectionError } from '../../services/lotSelection';

/**
 * Valida el lote de cada línea y arma los insumos del retiro. Las líneas sin
 * control por lotes viajan igual que antes.
 */
export function buildWithdrawalItems(items = []) {
  const lineErrors = {};
  const normalized = [];

  items.forEach((item) => {
    if (item.requires_lot) {
      const selection = {
        lotId: item.lotId,
        needsJustification: item.lotNeedsJustification,
        justification: item.lotJustification,
      };
      const error = !item.lotId
        ? `Elige el lote de ${item.name || 'este insumo'}.`
        : lotSelectionError(selection);
      if (error) lineErrors[item.item_id] = [error];
    }
    normalized.push({
      item_id: item.item_id,
      name: item.name,
      quantity: item.quantity,
      ...lotPayloadFields({
        lotId: item.lotId,
        needsJustification: item.lotNeedsJustification,
        justification: item.lotJustification,
      }),
    });
  });

  return { lineErrors, items: normalized };
}
