import React, { useState, useEffect } from 'react';
import { useMovementSubmit, generateClientUuid } from '../../hooks/useMovementSubmit';

export { generateClientUuid };

const KINDS = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'conteo', label: 'Conteo' },
  { value: 'merma', label: 'Merma' },
];

export default function MovementModal({ isOpen, item, onClose, onMovementRegistered }) {
  const [kind, setKind] = useState('entrada');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState('bodega');

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
      setLocation('bodega');
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMovement({ kind, quantity, reason, location });
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
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              Tipo de movimiento
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {KINDS.map(k => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => setKind(k.value)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: kind === k.value ? '1px solid var(--primary-2)' : '1px solid var(--border-glass)',
                    background: kind === k.value ? 'var(--primary)' : 'var(--chip-bg)',
                    color: kind === k.value ? 'var(--on-primary)' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {k.label}
                </button>
              ))}
            </div>
            {fieldErrors.kind && (
              <span style={{ fontSize: '11px', color: 'var(--error)', marginTop: '4px', display: 'block' }}>
                {Array.isArray(fieldErrors.kind) ? fieldErrors.kind.join(', ') : fieldErrors.kind}
              </span>
            )}
          </div>

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
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Ubicación
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
            >
              <option value="bodega">Bodega Principal</option>
              <option value="kitchen">Cocina</option>
              <option value="salon">Salón</option>
            </select>
            {fieldErrors.location && (
              <span style={{ fontSize: '11px', color: 'var(--error)', marginTop: '4px', display: 'block' }}>
                {Array.isArray(fieldErrors.location) ? fieldErrors.location.join(', ') : fieldErrors.location}
              </span>
            )}
          </div>

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

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '9999px',
                border: '1px solid var(--border-glass)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ flex: 1, padding: '12px', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer' }}
            >
              {submitting ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
