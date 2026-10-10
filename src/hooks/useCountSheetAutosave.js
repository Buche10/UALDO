import { useEffect, useRef, useCallback } from 'react';

const INACTIVITY_MS = 60000;
const DIRTY_THRESHOLD = 20;

/**
 * Guardado automático de la planilla de conteo (Brief 19p_fix, 19p_fix2).
 *
 * - Guarda al llegar a 20 insumos distintos pendientes, con la pestaña visible.
 * - Guarda tras 60 segundos sin cambios, con la pestaña visible.
 * - Al pasar a segundo plano guarda de inmediato (en Android puede ser la
 *   última oportunidad); al volver, si queda algo pendiente, reprograma.
 * - Limpia el temporizador y el escuchador al desmontar.
 */
export function useCountSheetAutosave({ savePendingLines, hasPendingChanges, pendingCount }) {
  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleInactivitySave = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (document.visibilityState === 'visible') savePendingLines();
    }, INACTIVITY_MS);
  }, [clearTimer, savePendingLines]);

  /** Se llama después de cada cambio de una línea. */
  const onLineChanged = useCallback(() => {
    if (pendingCount() >= DIRTY_THRESHOLD && document.visibilityState === 'visible') {
      savePendingLines();
    }
    scheduleInactivitySave();
  }, [pendingCount, savePendingLines, scheduleInactivitySave]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        clearTimer();
        savePendingLines();
      } else if (document.visibilityState === 'visible' && hasPendingChanges()) {
        scheduleInactivitySave();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTimer();
    };
  }, [clearTimer, hasPendingChanges, savePendingLines, scheduleInactivitySave]);

  return { onLineChanged };
}
