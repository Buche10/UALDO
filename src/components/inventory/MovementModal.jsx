import React, { useState, useEffect } from 'react';
import { useMovementSubmit, generateClientUuid } from '../../hooks/useMovementSubmit';
import { INVENTORY_LOCATIONS, DEFAULT_LOCATION } from '../../services/inventoryLocations';
import { emptyLotSelection } from '../../services/lotSelection';
import MovementKindSelector from './MovementKindSelector';
import MovementLotField from './MovementLotField';
import MovementModalActions from './MovementModalActions';

export { generateClientUuid };

export default function MovementModal({ isOpen, item, onClose, onMovementRegistered }) {
  const [kind, setKind] = useState('entrada');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [lotSelection, setLotSelection] = useState(emptyLotSelection);

  const {
    submitting,
    error,
    fieldErrors,
    validationError,
    initUuid,
    submitMovement,
  } = useMovementSubmit({ item, onClose, onMovementRegistered });

  useEffect(() => {
    if (isOpen) {
      initUuid();
      setKind('entrada');
      setQuantity('');
      setReason('');
      setLocation(DEFAULT_LOCATION);
      setLotSelection(emptyLotSelection());
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMovement({ kind, quantity, reason, location, lotSelection });
  };

  const handleKindChange = (value) => {
    setKind(value);
    setLotSelection(emptyLotSelection());
  };

  const handleLocationChange = (value) => {
    setLocation(value);
    setLotSelection(emptyLotSelection());
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid var(--border-glow)',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
          Registrar Movimiento
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--accent)', marginBottom: '14px', fontWeight: 600 }}>
          {item.name} — Stock actual: {Number(item.current_stock ?? item.stock ?? 0).toFixed(3)} {item.unit}
        </p>

        {error && (
          <div style={{ padding: '10px 12px', background: 'var(--error-soft)', border: '1px solid var(--error)', borderRadius: '10px', color: 'var(--error)', fontSize: '12px', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <MovementKindSelector kind={kind} fieldErrors={fieldErrors} onChange={handleKindChange} />

          <div>
            <label htmlFor="movement-quantity" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Cantidad ({item.unit}) *
            </label>
            <input
              id="movement-quantity"
              type="text"
              required
              placeholder="Ej: 2.5 o 2,5"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="glass-input"
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
            />
            {validationError && (
              <span style={{ fontSize: '11px', color: 'var(--error)', marginTop: '4px', display: 'block' }}>
                {validationError}
              </span>
            )}
            {fieldErrors.quantity && (
              <span style={{ fontSize: '11px', color: 'var(--error)', marginTop: '4px', display: 'block' }}>
                {Array.isArray(fieldErrors.quantity) ? fieldErrors.quantity.join(', ') : fieldErrors.quantity}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="movement-location-select" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Ubicación
            </label>
            <select
              id="movement-location-select"
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
            >
              {INVENTORY_LOCATIONS.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              La salida y el conteo se aplican solo a esta ubicación
            </span>
            {fieldErrors.location && (
              <span style={{ fontSize: '11px', color: 'var(--error)', marginTop: '4px', display: 'block' }}>
                {Array.isArray(fieldErrors.location) ? fieldErrors.location.join(', ') : fieldErrors.location}
              </span>
            )}
          </div>

          <MovementLotField
            item={item}
            kind={kind}
            location={location}
            selection={lotSelection}
            disabled={submitting}
            error={fieldErrors.lot_id}
            onChange={setLotSelection}
          />

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Motivo o nota (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Preparación almuerzo"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="glass-input"
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
            />
            {fieldErrors.reason && (
              <span style={{ fontSize: '11px', color: 'var(--error)', marginTop: '4px', display: 'block' }}>
                {Array.isArray(fieldErrors.reason) ? fieldErrors.reason.join(', ') : fieldErrors.reason}
              </span>
            )}
          </div>

          <MovementModalActions submitting={submitting} onClose={onClose} />
        </form>
      </div>
    </div>
  );
}
