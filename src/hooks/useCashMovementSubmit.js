import { useState, useRef } from 'react';
import { createMovement } from '../services/cashMovementsClient';

/**
 * Genera un UUID v4 seguro usando crypto.randomUUID o crypto.getRandomValues.
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
  return 'uuid-' + Math.random().toString(36).substring(2, 15);
}

/**
 * Hook para registrar movimientos de caja con garantia de idempotencia.
 *
 * @param {Object} options
 * @param {string} options.businessDate
 * @param {Function} [options.onSuccess]
 * @param {Function} [options.onClose]
 */
export function useCashMovementSubmit({ businessDate, onSuccess, onClose } = {}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const clientUuidRef = useRef(generateClientUuid());

  const initUuid = () => {
    clientUuidRef.current = generateClientUuid();
    setError(null);
    setFieldErrors({});
  };

  const submitMovement = async ({ kind, counterparty, amount, note }) => {
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    const res = await createMovement(
      {
        business_date: businessDate,
        kind,
        counterparty,
        amount,
        note
      },
      clientUuidRef.current
    );

    setSubmitting(false);

    if (res.ok) {
      const isIdempotent = res.status === 200;
      const message = isIdempotent ? 'Ya estaba registrado' : 'Movimiento registrado con exito.';
      clientUuidRef.current = generateClientUuid();

      if (onSuccess) {
        onSuccess({
          message,
          isIdempotent,
          data: res.data?.data || res.data
        });
      }

      if (onClose) {
        onClose();
      }

      return { ok: true, isIdempotent, data: res.data };
    }

    if (res.status === 409) {
      clientUuidRef.current = generateClientUuid();
      setError('Conflicto con el identificador del movimiento. Intenta de nuevo.');
      return { ok: false, status: 409, error: 'Conflicto con el identificador del movimiento.' };
    }

    if (res.status === 422) {
      if (res.data?.errors) {
        setFieldErrors(res.data.errors);
      }
      setError(res.data?.message || res.error || 'Datos invalidos para el movimiento.');
      return { ok: false, status: 422, error: res.data?.message || res.error };
    }

    if (res.isNetworkError) {
      setError('Error de conexion. Tu movimiento no se envio; vuelve a intentarlo.');
      return { ok: false, isNetworkError: true };
    }

    setError(res.error || 'Error al registrar el movimiento.');
    return { ok: false, status: res.status, error: res.error };
  };

  return {
    submitting,
    error,
    fieldErrors,
    submitMovement,
    initUuid,
    getClientUuid: () => clientUuidRef.current
  };
}
