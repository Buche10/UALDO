import { useCallback, useEffect, useState } from 'react';
import { getLot } from '../services/lotsClient';

/** Trazabilidad de un lote con la página de movimientos pedida. */
export function useLotDetail(lotId, page = 1) {
  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getLot(lotId, page);
    setLoading(false);
    if (res.ok && res.data?.data) {
      setLot(res.data.data);
      return res.data.data;
    }
    setError(res.error || 'No se pudo cargar el lote.');
    return null;
  }, [lotId, page]);

  useEffect(() => {
    load();
  }, [load]);

  return { lot, setLot, loading, error, reload: load };
}
