import React from 'react';
import { INVENTORY_LOCATIONS } from '../../services/inventoryLocations';
import LotPicker from '../lots/LotPicker';

const fieldLabel = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' };
const selectStyle = { width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' };

function FieldError({ error }) {
  if (!error) return null;
  return (
    <span style={{ fontSize: '11px', color: 'var(--error)', marginTop: '4px', display: 'block' }}>
      {Array.isArray(error) ? error.join(', ') : error}
    </span>
  );
}

/** Campos del formulario de transferencia, incluido el lote de carne. */
export default function TransferFormFields(props) {
  const {
    item, from, to, quantity, reason, fieldErrors, availableInOrigin,
    lotSelection, disabled, onFromChange, onToChange, onQuantityChange, onReasonChange, onLotChange,
  } = props;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label htmlFor="transfer-from-select" style={fieldLabel}>Origen</label>
          <select id="transfer-from-select" value={from} onChange={(event) => onFromChange(event.target.value)} style={selectStyle}>
            {INVENTORY_LOCATIONS.map((loc) => (
              <option key={loc.value} value={loc.value}>{loc.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="transfer-to-select" style={fieldLabel}>Destino</label>
          <select id="transfer-to-select" value={to} onChange={(event) => onToChange(event.target.value)} style={selectStyle}>
            {INVENTORY_LOCATIONS.map((loc) => (
              <option key={loc.value} value={loc.value}>{loc.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', fontSize: '12px', color: 'var(--text-muted)' }}>
        <span>Disponible en el origen: </span>
        <strong style={{ color: 'var(--accent)' }}>{availableInOrigin} {item.unit || ''}</strong>
      </div>

      {item.requires_lot && (
        <LotPicker
          itemId={item.id}
          itemName={item.name}
          unit={item.unit}
          location={from}
          requiresLot
          value={lotSelection}
          onChange={onLotChange}
          disabled={disabled}
        />
      )}

      <div>
        <label htmlFor="transfer-quantity-input" style={fieldLabel}>
          Cantidad a transferir ({item.unit || 'unidades'})
        </label>
        <input
          id="transfer-quantity-input"
          type="text"
          inputMode="decimal"
          placeholder="Ej: 2.500"
          value={quantity}
          onChange={(event) => onQuantityChange(event.target.value)}
          className="glass-input"
          style={inputStyle}
        />
        <FieldError error={fieldErrors.quantity} />
      </div>

      <div>
        <label htmlFor="transfer-reason-input" style={fieldLabel}>
          Motivo o nota (opcional)
        </label>
        <input
          id="transfer-reason-input"
          type="text"
          placeholder="Ej: Reposición de cocina"
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          className="glass-input"
          style={inputStyle}
        />
        <FieldError error={fieldErrors.reason} />
      </div>
    </>
  );
}
