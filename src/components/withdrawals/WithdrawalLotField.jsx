import React from 'react';
import LotPicker from '../lots/LotPicker';

/** Lote del insumo retirado desde bodega. */
export default function WithdrawalLotField({ item, lineError, disabled, onChange }) {
  return (
    <LotPicker
      itemId={item.item_id}
      itemName={item.name}
      unit={item.unit}
      location="warehouse"
      requiresLot
      value={{
        lotId: item.lotId,
        justification: item.lotJustification,
        needsJustification: item.lotNeedsJustification,
        recommendedCode: item.recommendedCode,
        chosenCode: item.chosenCode,
      }}
      onChange={(selection) => onChange(item.tempId, {
        lotId: selection.lotId,
        lotJustification: selection.justification,
        lotNeedsJustification: selection.needsJustification,
        recommendedCode: selection.recommendedCode,
        chosenCode: selection.chosenCode,
      })}
      disabled={disabled}
      error={lineError && lineError.lot}
    />
  );
}
