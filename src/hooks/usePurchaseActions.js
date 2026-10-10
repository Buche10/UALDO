import { useCallback, useEffect, useState } from 'react';
import { cancelPurchase, getPurchase, receivePurchase, replacePurchaseLines } from '../services/purchasesClient';
import { mapLineErrors, toPayloadLines } from './purchaseLines';

const CLOSED_MESSAGE = 'La compra ya estaba recibida o cancelada: no se puede cambiar.';

/**
 * Detalle completo de una compra (Brief 20p). La lista del motor no trae las
 * líneas: el detalle siempre se pide con `getPurchase`.
 */
export function usePurchaseDetail(purchaseId) {
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getPurchase(purchaseId);
    setLoading(false);
    if (res.ok && res.data?.data) {
      setPurchase(res.data.data);
      return res.data.data;
    }
    setError(res.error || 'No se pudo cargar la compra.');
    return null;
  }, [purchaseId]);

  useEffect(() => {
    load();
  }, [load]);

  return { purchase, setPurchase, loading, error, reload: load };
}

/**
 * Acciones sobre un borrador: guardar líneas, recibir y cancelar (Brief 20p).
 * Un 409 explica que la compra ya estaba cerrada y pide al motor el estado
 * real (`onStale`); un 422 de líneas vuelve con los errores de cada línea.
 */
export function usePurchaseActions({ purchaseId, onUpdated, onStale }) {
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
    const fallback = res.status === 409 ? CLOSED_MESSAGE : 'No se pudo completar la acción.';
    setError(res.data?.message || res.error || fallback);
    if (res.status === 409 && onStale) onStale();
    return { ok: false, res };
  };

  const receive = () => run('receive', () => receivePurchase(purchaseId));
  const cancel = () => run('cancel', () => cancelPurchase(purchaseId));

  /** Devuelve los errores por línea y el general si se rechazan las líneas. */
  const saveLines = async (lines) => {
    const result = await run('lines', () => replacePurchaseLines(purchaseId, toPayloadLines(lines)));
    if (result.ok) return { ok: true, lineErrors: {}, general: null };
    const mapped = mapLineErrors(result.res?.data?.errors, lines);
    return { ok: false, lineErrors: mapped.byLine, general: mapped.general.lines || null };
  };

  return { busy, error, receive, cancel, saveLines, clearError: () => setError(null) };
}
