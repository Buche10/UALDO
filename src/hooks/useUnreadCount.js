import { useState, useEffect, useRef, useCallback } from 'react';
import { getUnreadCount } from '../services/notificationsClient';
import { isAuthenticated } from '../services/auth';

const BASE_INTERVAL_MS = 60 * 1000; // 60 segundos
const MAX_INTERVAL_MS = 10 * 60 * 1000; // 10 minutos (backoff)

/**
 * Hook para mantener actualizado el conteo de avisos sin leer en el Header.
 * Reglas:
 * - Consulta cada 60s SOLO si document.visibilityState === 'visible'.
 * - Refresca al volver a primer plano (visibilitychange a 'visible').
 * - Ante errores de red duplica el intervalo hasta 10 min, volviendo a 60s tras éxito.
 * - Se detiene inmediatamente si se emite ualdo:unauthorized.
 * - Limpia temporizadores y listeners al desmontarse.
 */
export function useUnreadCount({ enabled = true } = {}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const currentIntervalRef = useRef(BASE_INTERVAL_MS);
  const timerRef = useRef(null);
  const isStoppedRef = useRef(false);

  const isEnabled = () => {
    return enabled && !isStoppedRef.current && isAuthenticated();
  };

  const fetchCount = useCallback(async () => {
    if (!isEnabled()) {
      return;
    }
    // Solo consultar si la pestaña está visible
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return;
    }

    const res = await getUnreadCount();
    if (isStoppedRef.current) return;

    const countVal = typeof res.data?.count === 'number' ? res.data.count : (typeof res.count === 'number' ? res.count : null);

    if (res.ok && countVal !== null) {
      setUnreadCount(countVal);
      currentIntervalRef.current = BASE_INTERVAL_MS; // Restablecer intervalo
    } else {
      // Error de red o servidor: duplicar con tope de 10 min
      currentIntervalRef.current = Math.min(currentIntervalRef.current * 2, MAX_INTERVAL_MS);
    }

    // Programar siguiente ciclo
    scheduleNext(currentIntervalRef.current);
  }, [enabled]);

  const scheduleNext = useCallback((delay) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (isEnabled()) {
      timerRef.current = setTimeout(() => {
        fetchCount();
      }, delay);
    }
  }, [fetchCount]);

  const refreshNow = useCallback(() => {
    currentIntervalRef.current = BASE_INTERVAL_MS;
    fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    isStoppedRef.current = false;

    // Primer chequeo al montar si autenticado
    if (isAuthenticated()) {
      fetchCount();
    }

    // Listener para visibilidad de la pestaña
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated() && !isStoppedRef.current) {
        refreshNow();
      }
    };

    // Listener para pérdida de sesión
    const handleUnauthorized = () => {
      isStoppedRef.current = true;
      setUnreadCount(0);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    // Listener para actualización manual tras leer avisos
    const handleRefreshEvent = () => {
      if (!isStoppedRef.current && isAuthenticated()) {
        refreshNow();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('ualdo:unauthorized', handleUnauthorized);
    window.addEventListener('ualdo:notifications-updated', handleRefreshEvent);

    return () => {
      isStoppedRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('ualdo:unauthorized', handleUnauthorized);
      window.removeEventListener('ualdo:notifications-updated', handleRefreshEvent);
    };
  }, [fetchCount, refreshNow]);

  return {
    unreadCount,
    refreshUnreadCount: refreshNow,
  };
}
