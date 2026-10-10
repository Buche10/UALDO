import { useCallback, useEffect, useRef, useState } from 'react';
import { listRuns, listTemplates } from '../services/productionClient';

/**
 * Producciones del negocio, paginadas de 20 (Brief 21p).
 */
export function useProductionRuns() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const loadingRef = useRef(false);

  const load = useCallback(async (pageToLoad, append) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    const res = await listRuns({ page: pageToLoad });
    loadingRef.current = false;
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'No se pudieron cargar las producciones.');
      return;
    }
    const list = res.data?.data || [];
    // Una producción registrada aquí corre las páginas del motor: al agregar la
    // siguiente se descartan las que ya están en la lista.
    setRuns((prev) => (append ? [...prev, ...list.filter((run) => !prev.some((known) => known.id === run.id))] : list));
    const meta = res.data?.meta || {};
    setHasMore(Number(meta.current_page) < Number(meta.last_page));
    setPage(pageToLoad);
  }, []);

  useEffect(() => {
    load(1, false);
  }, [load]);

  /** Reemplaza o agrega una producción ya conocida (al registrar o anular). */
  const upsertRun = useCallback((run) => {
    if (!run?.id) return;
    setRuns((prev) => (prev.some((r) => r.id === run.id) ? prev.map((r) => (r.id === run.id ? run : r)) : [run, ...prev]));
  }, []);

  return {
    runs,
    loading,
    error,
    hasMore,
    reload: () => load(1, false),
    loadMore: () => load(page + 1, true),
    upsertRun,
  };
}

/**
 * Fichas activas de producción (Brief 21p).
 */
export function useProductionTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await listTemplates();
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'No se pudieron cargar las fichas.');
      return;
    }
    setTemplates(res.data?.data || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { templates, loading, error, reload: load };
}
