import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_AGE_ALERT_DAYS, getLotSettings } from '../services/lotsClient';

/**
 * Días de aviso de antigüedad. El endpoint exige settings.manage: quien no
 * lo tiene ve el valor por defecto del motor (5) sin provocar un 403.
 */
export function useLotSettings(enabled = true) {
  const [ageAlertDays, setAgeAlertDays] = useState(DEFAULT_AGE_ALERT_DAYS);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await getLotSettings();
    setLoading(false);
    if (res.ok) {
      const days = Number(res.data?.data?.age_alert_days);
      setAgeAlertDays(Number.isInteger(days) && days > 0 ? days : DEFAULT_AGE_ALERT_DAYS);
    } else {
      setError(res.error || 'No se pudo cargar el aviso de antigüedad.');
    }
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { ageAlertDays, setAgeAlertDays, loading, error, reload: load };
}
