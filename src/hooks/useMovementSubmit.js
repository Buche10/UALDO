import { useState, useRef } from 'react';
import { registerMovement, normalizeQuantity } from '../services/inventoryClient';

/**
 * Genera un UUID v4 usando crypto.randomUUID o crypto.getRandomValues como respaldo seguro.
 * Nunca utiliza Date.now().
 */
export function generateClientUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  throw new Error('Criptografia no disponible para generar UUID');
}

/**
 * Hook para manejar el ciclo de envío de movimientos con idempotencia,
 * normalización de cantidad y manejo de errores 201, 200, 409, 422 y red.
 */
export function useMovementSubmit({ item, onClose, onMovementRegistered }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationError, setValidationError] = useState(null);

  const clientUuidRef = useRef('');

  const initUuid = () => {
    clientUuidRef.current = generateClientUuid();
    setError(null);
    setFieldErrors({});
    setValidationError(null);
  };

  const submitMovement = async ({ kind, quantity, reason, location }) => {
    setValidationError(null);
    setError(null);
    setFieldErrors({});

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
      const isIdempotent = res.data?.status === 'idempotent';
      clientUuidRef.current = generateClientUuid();
      onMovementRegistered({
        success: true,
        message: isIdempotent ? 'Movimiento ya estaba registrado.' : 'Movimiento registrado con éxito.',
        item: res.data?.item,
      });
      onClose();
    } else {
      if (res.status === 409) {
        if (res.data?.message && res.data.message.includes('client_uuid ya usado en otro insumo')) {
          console.error('[Inventory] Conflicto de client_uuid entre insumos');
          clientUuidRef.current = generateClientUuid();
          setError('Ocurrió un conflicto de identificador. Se ha generado uno nuevo, intenta de nuevo.');
        } else {
          setError(res.data?.message || res.error || 'Stock insuficiente para este movimiento.');
        }
      } else if (res.status === 422) {
        if (res.data?.errors) {
          setFieldErrors(res.data.errors);
        }
        setError(res.error || 'Datos del movimiento inválidos.');
      } else if (res.isNetworkError) {
        setError('Sin conexión. Tu movimiento no se registró; vuelve a intentarlo.');
      } else {
        setError(res.error || 'Error al registrar el movimiento.');
      }
    }
  };

  return {
    submitting,
    error,
    fieldErrors,
    validationError,
    initUuid,
    submitMovement,
  };
}
