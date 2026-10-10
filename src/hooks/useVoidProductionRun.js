import { useState } from 'react';
import { voidRun } from '../services/productionClient';

/**
 * Anular una producción (solo el dueño; el motor responde 403 al personal).
 * Un 409 explica que una porción ya se usó o que ya estaba anulada.
 */
export function useVoidProductionRun({ onVoided }) {
  const [voiding, setVoiding] = useState(false);
  const [error, setError] = useState(null);

  const submitVoid = async (runId, reason) => {
    if (voiding) return false;
    setError(null);
    setVoiding(true);
    const res = await voidRun(runId, reason);
    setVoiding(false);

    if (res.ok) {
      if (onVoided) onVoided(res.data?.data);
      return true;
    }
    if (res.status === 409) {
      setError(res.data?.message || 'No se puede anular: una porción ya se usó o la producción ya estaba anulada.');
    } else if (res.status === 403) {
      setError('Solo el dueño puede anular una producción.');
    } else {
      setError(res.data?.message || res.error || 'No se pudo anular la producción.');
    }
    return false;
  };

  return { voiding, error, submitVoid, clearError: () => setError(null) };
}
