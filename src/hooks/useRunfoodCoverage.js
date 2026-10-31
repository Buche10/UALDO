import { useState, useCallback, useEffect } from 'react';
import { getRunfoodCoverage } from '../services/runfoodCatalogClient';

/**
 * Hook dedicado a la consulta de cobertura de ventas por recetas (Brief 24p-fix).
 *
 * @param {{ initialDays?: number }} [options]
 */
export function useRunfoodCoverage({ initialDays = 7 } = {}) {
  const [days, setDays] = useState(initialDays);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCoverage = useCallback(async (targetDays = days) => {
    setLoading(true);
    setError(null);
    const res = await getRunfoodCoverage({ days: targetDays });
    setLoading(false);

    if (res.ok) {
      setData(res.data);
    } else {
      setError(res.error || 'No se pudo cargar la cobertura de ventas.');
    }
  }, [days]);

  useEffect(() => {
    loadCoverage(days);
  }, [days, loadCoverage]);

  return {
    days,
    setDays,
    data,
    loading,
    error,
    reload: () => loadCoverage(days)
  };
}
