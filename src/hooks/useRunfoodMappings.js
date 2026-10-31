import { useState, useCallback, useEffect, useRef } from 'react';
import {
  listRunfoodMappings,
  updateRunfoodMapping,
  acceptRunfoodMappingSuggestion,
  ignoreRunfoodMapping,
  reopenRunfoodMapping
} from '../services/runfoodCatalogClient';
import { usePagedList } from './usePagedList';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Hook para la gestión de mapeos entre ingredientes de RunFood e insumos de Ualdo (Brief 24p-fix).
 * Maneja pestañas por estado, búsqueda con espera de 300 ms, paginación y acciones unitarias.
 */
export function useRunfoodMappings({ initialStatus = 'pending', initialSearch = '' } = {}) {
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  // Mensajes de error de acción y errores por campo 422
  const [actionError, setActionError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successBanner, setSuccessBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);

  // Contadores de las pestañas
  const [counts, setCounts] = useState({ pending: 0, confirmed: 0, ignored: 0 });

  // Si cambia initialSearch externamente (ej: pulsar Asociar en receta)
  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
      setDebouncedSearch(initialSearch.trim());
      setStatus('pending');
    }
  }, [initialSearch]);

  // Debounce de búsqueda de 300 ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Carga de contadores para cada pestaña
  const refreshCounts = useCallback(async () => {
    const [pRes, cRes, iRes] = await Promise.all([
      listRunfoodMappings({ status: 'pending', per_page: 1 }),
      listRunfoodMappings({ status: 'confirmed', per_page: 1 }),
      listRunfoodMappings({ status: 'ignored', per_page: 1 })
    ]);

    setCounts({
      pending: pRes.ok ? (pRes.data?.meta?.total ?? 0) : 0,
      confirmed: cRes.ok ? (cRes.data?.meta?.total ?? 0) : 0,
      ignored: iRes.ok ? (iRes.data?.meta?.total ?? 0) : 0
    });
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  // Consulta paginada con usePagedList
  const fetchPage = useCallback(
    (page) => listRunfoodMappings({
      status,
      search: debouncedSearch || undefined,
      page
    }),
    [status, debouncedSearch]
  );

  const paged = usePagedList(fetchPage, {
    errorMessage: 'No se pudieron cargar los mapeos de ingredientes.'
  });

  const bannerTimerRef = useRef(null);
  const showSuccess = (msg) => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setSuccessBanner(msg);
    bannerTimerRef.current = setTimeout(() => setSuccessBanner(null), 4000);
  };

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const clearErrors = useCallback(() => {
    setActionError(null);
    setFieldErrors({});
  }, []);

  // Ayudante unificado para acciones de mapeo (<50 líneas)
  const runAction = useCallback(async (mappingId, call, successMessage, mapError) => {
    clearErrors();
    setSubmitting(true);
    setSubmittingId(mappingId);

    const res = await call();
    setSubmitting(false);
    setSubmittingId(null);

    if (res.ok) {
      const updated = res.data?.data || res.data;
      const newStatus = updated?.status;
      if (newStatus && newStatus !== status) {
        paged.remove(mappingId);
      } else if (updated?.id) {
        paged.upsert(updated);
      }
      refreshCounts();
      if (successMessage) showSuccess(successMessage);
      return { ok: true, data: updated };
    }

    if (res.status === 422 && res.data?.errors) {
      setFieldErrors(res.data.errors);
    }
    const mapped = mapError ? mapError(res) : null;
    const errMsg = mapped || res.data?.message || res.error || 'Ocurrió un error al procesar la acción.';
    setActionError(errMsg);
    return { ok: false, error: errMsg, errors: res.data?.errors };
  }, [clearErrors, status, paged, refreshCounts]);

  const handleAcceptSuggestion = (mappingId) =>
    runAction(
      mappingId,
      () => acceptRunfoodMappingSuggestion(mappingId),
      'Sugerencia aceptada exitosamente.',
      (res) => (res.status === 409 ? 'Este ingrediente ya no tiene sugerencia; elige un insumo' : null)
    );

  const handleUpdateMapping = (mappingId, { inventory_item_id, factor }) =>
    runAction(
      mappingId,
      () => updateRunfoodMapping(mappingId, { inventory_item_id, factor }),
      'Mapeo de ingrediente guardado exitosamente.'
    );

  const handleIgnoreMapping = (mappingId) =>
    runAction(
      mappingId,
      () => ignoreRunfoodMapping(mappingId),
      'Ingrediente ignorado. No se descontará del inventario.'
    );

  const handleReopenMapping = (mappingId) =>
    runAction(
      mappingId,
      () => reopenRunfoodMapping(mappingId),
      'Ingrediente reabierto a pendiente.'
    );

  return {
    status,
    setStatus,
    search,
    setSearch,
    counts,
    items: paged.items,
    loading: paged.loading,
    error: paged.error,
    hasMore: paged.hasMore,
    loadMore: paged.loadMore,
    reload: () => {
      paged.reload();
      refreshCounts();
    },
    actionError,
    setActionError,
    fieldErrors,
    clearErrors,
    successBanner,
    submitting,
    submittingId,
    handleAcceptSuggestion,
    handleUpdateMapping,
    handleIgnoreMapping,
    handleReopenMapping
  };
}
