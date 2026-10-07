import React, { useState, useEffect, useRef } from 'react';
import { registerMovement, normalizeQuantity } from '../../services/inventoryClient';

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  // Idempotencia: el UUID se genera al abrir y SE REUTILIZA en reintentos
  const clientUuidRef = useRef('');

  useEffect(() => {
    if (isOpen) {
      clientUuidRef.current = crypto.randomUUID ? crypto.randomUUID() : `uuid-${Date.now()}-${Math.random()}`;
      setKind('entrada');
      setQuantity('');
      setReason('');
      setLocation('bodega');
      setError(null);
      setValidationError(null);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);
    setError(null);

    const normQty = normalizeQuantity(quantity);
    if (!normQty) {
      setValidationError('Ingresa una cantidad válida positiva (hasta 3 decimales).');
      return;
    }

    setSubmitting(true);
    const res = await registerMovement(
      item.id,
      {
        kind,
        quantity: normQty,
        reason,
        location,
      },
      clientUuidRef.current
    );
    setSubmitting(false);

    if (res.ok) {
      // 201 o 200 idempotent
      const isIdempotent = res.data?.status === 'idempotent';
      // Generar nuevo UUID para el próximo movimiento
      clientUuidRef.current = crypto.randomUUID ? crypto.randomUUID() : `uuid-${Date.now()}`;
      onMovementRegistered({
        success: true,
        message: isIdempotent ? 'Movimiento ya estaba registrado.' : 'Movimiento registrado con éxito.',
        item: res.data?.item,
      });
      onClose();
    } else {
      // Manejo de errores específicos
      if (res.status === 409) {
        if (res.data?.message && res.data.message.includes('client_uuid ya usado en otro insumo')) {
          console.error('[Inventory] Conflicto de client_uuid entre insumos');
          clientUuidRef.current = crypto.randomUUID ? crypto.randomUUID() : `uuid-${Date.now()}`;
          setError('Ocurrió un conflicto de identificador. Se ha generado uno nuevo, intenta de nuevo.');
        } else {
          setError(res.error || res.data?.message || 'Stock insuficiente para este movimiento.');
        }
      } else if (res.status === 422) {
        setError(res.error || 'Datos del movimiento inválidos.');
      } else if (res.isNetworkError) {
        setError('Sin conexión. Tu movimiento no se registró; vuelve a intentarlo.');
      } else {
        setError(res.error || 'Error al registrar el movimiento.');
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(21, 21, 19, 0.85)',
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
          <div style={{ padding: '10px 12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--error)', borderRadius: '10px', color: 'var(--error)', fontSize: '12px', marginBottom: '14px' }}>
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
                    background: kind === k.value ? 'var(--primary)' : 'rgba(32, 45, 47, 0.6)',
                    color: kind === k.value ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {k.label}
                </button>
              ))}
            </div>
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
