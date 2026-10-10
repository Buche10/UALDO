import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Lista paginada del motor (Brief 20p).
 *
 * - Carga la primera página al montar y cada vez que cambian los filtros
 *   (`fetchPage` cambia); esa carga reemplaza a cualquier otra en curso y las
 *   respuestas viejas se descartan.
 * - "Cargar más" no se superpone con otra carga y no duplica elementos.
 * - `upsert` refleja un elemento creado o cambiado aquí.
 *
 * @param {(page: number) => Promise<object>} fetchPage  Estable (useCallback).
 */
export function usePagedList(fetchPage, { errorMessage }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const requestRef = useRef(0);
  const loadingRef = useRef(false);

  const load = useCallback(async (pageToLoad, append) => {
    if (append && loadingRef.current) return;
    const requestId = ++requestRef.current;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    const res = await fetchPage(pageToLoad);
    if (requestId !== requestRef.current) return;
    loadingRef.current = false;
    setLoading(false);
    if (!res.ok) {
      setError(res.error || errorMessage);
      return;
    }
    const list = res.data?.data || [];
    setItems((prev) => (append ? [...prev, ...list.filter((item) => !prev.some((known) => known.id === item.id))] : list));
    const meta = res.data?.meta || {};
    setHasMore(Number(meta.current_page) < Number(meta.last_page));
    setPage(pageToLoad);
  }, [fetchPage, errorMessage]);

  useEffect(() => {
    load(1, false);
  }, [load]);

  useEffect(() => () => { requestRef.current += 1; }, []);

  const upsert = useCallback((item) => {
    if (!item?.id) return;
    setItems((prev) => (prev.some((known) => known.id === item.id) ? prev.map((known) => (known.id === item.id ? item : known)) : [item, ...prev]));
  }, []);

  return {
    items,
    loading,
    error,
    hasMore,
    reload: () => load(1, false),
    loadMore: () => load(page + 1, true),
    upsert,
  };
}
