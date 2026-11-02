import { useCallback, useEffect, useRef, useState } from 'react';
import { listLots } from '../services/lotsClient';

const byAge = (a, b) => {
  const dateA = String(a.received_on || '');
  const dateB = String(b.received_on || '');
  if (dateA !== dateB) return dateA.localeCompare(dateB);
  return Number(a.id) - Number(b.id);
};

/**
 * Lotes paginados con filtros de estado e insumo. El motor ya devuelve el
 * orden FIFO; se vuelve a ordenar por fecha e id como defensa.
 */
export function useLotsList({ status = 'activo', itemId = '', pageSize = 50 } = {}) {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const requestRef = useRef(0);

  const load = useCallback(async (page = 1, append = false) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    const res = await listLots({ status, itemId, page });
    if (requestRef.current !== requestId) return;
    if (page === 1) setLoading(false);
    else setLoadingMore(false);

    if (!res.ok) {
      setError(res.error || 'No se pudieron cargar los lotes.');
      if (page === 1) setLots([]);
      return;
    }
    const rows = res.data?.data || [];
    setMeta(res.data?.meta || { current_page: page, last_page: page });
    setLots((prev) => (append ? [...prev, ...rows] : rows).sort(byAge));
  }, [status, itemId]);

  useEffect(() => {
    load(1, false);
  }, [load]);

  useEffect(() => () => {
    requestRef.current += 1;
  }, []);

  const loadMore = () => {
    if (loadingMore || loading) return;
    if (Number(meta.current_page) >= Number(meta.last_page)) return;
    load(Number(meta.current_page) + 1, true);
  };

  return {
    lots,
    loading,
    loadingMore,
    error,
    meta,
    hasMore: Number(meta.current_page) < Number(meta.last_page),
    loadMore,
    reload: () => load(1, false),
    pageSize,
  };
}
