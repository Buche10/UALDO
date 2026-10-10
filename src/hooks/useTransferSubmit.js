import { useState, useRef, useCallback } from 'react';
import { transferStock, normalizeQuantity } from '../services/inventoryClient';
import { generateClientUuid } from './useMovementSubmit';

/**
 * Hook para gestionar el envío de transferencias de inventario entre ubicaciones con idempotencia.
 */
export function useTransferSubmit({ item, onClose, onTransferSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationError, setValidationError] = useState(null);

  const clientUuidRef = useRef('');

  const initUuid = useCallback(() => {
    clientUuidRef.current = generateClientUuid();
    setError(null);
    setFieldErrors({});
    setValidationError(null);
  }, []);

  const submitTransfer = useCallback(async ({ from, to, quantity, reason }) => {
    setValidationError(null);
    setError(null);
    setFieldErrors({});

    if (from === to) {
      setValidationError('El origen y el destino deben ser diferentes.');
      return;
    }

    const normQty = normalizeQuantity(quantity);
    if (!normQty) {
      setValidationError('Ingresa una cantidad válida mayor que 0 (hasta 3 decimales).');
      return;
    }

    const availableInOrigin = item?.stock_by_location?.[from];
    if (availableInOrigin !== undefined && availableInOrigin !== null) {
      const availNum = Number(availableInOrigin);
      const reqNum = Number(normQty);
      if (reqNum > availNum) {
        setValidationError(`La cantidad supera el disponible en el origen (${availNum.toLocaleString('es-EC', { maximumFractionDigits: 3 })} ${item.unit || ''}).`);
        return;
      }
    }

    setSubmitting(true);
    const res = await transferStock(
      {
        itemId: item.id,
        from,
        to,
        quantity: normQty,
        reason,
      },
      clientUuidRef.current
    );
    setSubmitting(false);

    if (res.ok) {
      const isIdempotent = res.data?.status === 'idempotent';
      clientUuidRef.current = generateClientUuid();
      if (onTransferSuccess) {
        onTransferSuccess({
          success: true,
          message: isIdempotent ? 'Ya estaba registrada' : 'Transferencia realizada con éxito.',
          item: res.data?.item,
        });
      }
      if (onClose) onClose();
    } else {
      if (res.status === 409) {
        if (res.data?.message && res.data.message.includes('client_uuid ya usado')) {
          clientUuidRef.current = generateClientUuid();
        }
        setError(res.data?.message || res.error || 'Stock insuficiente en la ubicación de origen.');
      } else if (res.status === 422) {
        if (res.data?.errors) {
          setFieldErrors(res.data.errors);
        }
        setError(res.error || res.data?.message || 'Datos de la transferencia inválidos.');
      } else if (res.isNetworkError) {
        setError('Sin conexión. Tu transferencia no se registró; vuelve a intentarlo.');
      } else {
        setError(res.error || res.data?.message || 'Error al realizar la transferencia.');
      }
    }
  }, [item, onClose, onTransferSuccess]);

  return {
    submitting,
    error,
    fieldErrors,
    validationError,
    initUuid,
    submitTransfer,
  };
}
