import { useState } from 'react';
import { cancelPurchase, receivePurchase, replacePurchaseLines } from '../services/purchasesClient';
import { mapLineErrors, toPayloadLines } from './purchaseLines';

const CLOSED_MESSAGE = 'La compra ya estaba recibida o cancelada: no se puede cambiar.';

/**
 * Acciones sobre un borrador: guardar líneas, recibir y cancelar (Brief 20p).
 * Un 409 explica que la compra ya estaba cerrada; un 422 de líneas vuelve con
 * los errores traducidos a cada línea.
 */
export function usePurchaseActions({ purchaseId, onUpdated }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const run = async (action, call) => {
    if (busy) return { ok: false };
    setError(null);
    setBusy(action);
    const res = await call();
    setBusy(null);
    if (res.ok) {
      if (onUpdated) onUpdated(res.data?.data, action);
      return { ok: true };
    }
    if (res.status === 409) setError(res.data?.message || CLOSED_MESSAGE);
    else setError(res.data?.message || res.error || 'No se pudo completar la acción.');
    return { ok: false, res };
  };

  const receive = () => run('receive', () => receivePurchase(purchaseId));
  const cancel = () => run('cancel', () => cancelPurchase(purchaseId));

  /** Devuelve los errores por línea si el motor o el cliente rechazan las líneas. */
  const saveLines = async (lines) => {
    const result = await run('lines', () => replacePurchaseLines(purchaseId, toPayloadLines(lines)));
    if (result.ok) return { ok: true, lineErrors: {} };
    return { ok: false, lineErrors: mapLineErrors(result.res?.data?.errors, lines).byLine };
  };

  return { busy, error, receive, cancel, saveLines, clearError: () => setError(null) };
}
