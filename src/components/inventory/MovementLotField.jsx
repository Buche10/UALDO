import React from 'react';
import LotPicker from '../lots/LotPicker';

/** Lote de una merma manual de un insumo con control por lotes. */
export default function MovementLotField({ item, kind, location, selection, disabled, error, onChange }) {
  if (kind !== 'merma' || !item.requires_lot) return null;
  return (
    <LotPicker
      itemId={item.id}
      itemName={item.name}
      unit={item.unit}
      location={location}
      requiresLot
      value={selection}
      onChange={onChange}
      disabled={disabled}
      error={error}
    />
  );
}
