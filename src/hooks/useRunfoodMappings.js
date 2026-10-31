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
 * Hook para la gestión de mapeos entre ingredientes de RunFood e insumos de Ualdo (Brief 24p).
 * Maneja pestañas por estado, búsqueda con espera de 300 ms, paginación y acciones unitarias.
 */
export function useRunfoodMappings({ initialStatus = 'pending' } = {}) {
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Mensajes globales de éxito y error de acción
  const [actionError, setActionError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successBanner, setSuccessBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);

  // Contadores de las pestañas
  const [counts, setCounts] = useState({ pending: 0, confirmed: 0, ignored: 0 });

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

  // Acción: Aceptar sugerencia
  const handleAcceptSuggestion = async (mappingId) => {
    setActionError(null);
    setFieldErrors({});
    setSubmitting(true);
    setSubmittingId(mappingId);

    const res = await acceptRunfoodMappingSuggestion(mappingId);
    setSubmitting(false);
    setSubmittingId(null);

    if (res.ok) {
      const updated = res.data?.data || res.data;
      if (status === 'pending') {
        paged.remove(mappingId);
      } else if (updated?.id) {
        paged.upsert(updated);
      }
      refreshCounts();
      showSuccess('Sugerencia aceptada exitosamente.');
      return { ok: true, data: updated };
    }

    let errMsg = res.error || 'Error al aceptar sugerencia.';
    if (res.status === 409) {
      errMsg = 'Este ingrediente ya no tiene sugerencia; elige un insumo';
    } else if (res.status === 422) {
      errMsg = res.data?.message || 'El insumo sugerido ya no es válido.';
    }
    setActionError(errMsg);
    return { ok: false, error: errMsg };
  };

  // Acción: Confirmar con insumo y factor
  const handleUpdateMapping = async (mappingId, { inventory_item_id, factor }) => {
    setActionError(null);
    setFieldErrors({});
    setSubmitting(true);
    setSubmittingId(mappingId);

    const res = await updateRunfoodMapping(mappingId, { inventory_item_id, factor });
    setSubmitting(false);
    setSubmittingId(null);

    if (res.ok) {
      const updated = res.data?.data || res.data;
      if (status === 'pending') {
        paged.remove(mappingId);
      } else if (updated?.id) {
        paged.upsert(updated);
      }
      refreshCounts();
      showSuccess('Mapeo de ingrediente guardado exitosamente.');
      return { ok: true, data: updated };
    }

    if (res.status === 422 && res.data?.errors) {
      setFieldErrors(res.data.errors);
    }
    const errMsg = res.error || 'Error al guardar mapeo.';
    setActionError(errMsg);
    return { ok: false, error: errMsg, errors: res.data?.errors };
  };

  // Acción: Ignorar ingrediente
  const handleIgnoreMapping = async (mappingId) => {
    setActionError(null);
    setFieldErrors({});
    setSubmitting(true);
    setSubmittingId(mappingId);

    const res = await ignoreRunfoodMapping(mappingId);
    setSubmitting(false);
    setSubmittingId(null);

    if (res.ok) {
      const updated = res.data?.data || res.data;
      if (status === 'pending' || status === 'confirmed') {
        paged.remove(mappingId);
      } else if (updated?.id) {
        paged.upsert(updated);
      }
      refreshCounts();
      showSuccess('Ingrediente ignorado. No se descontará del inventario.');
      return { ok: true };
    }

    const errMsg = res.error || 'Error al ignorar ingrediente.';
    setActionError(errMsg);
    return { ok: false, error: errMsg };
  };

  // Acción: Reabrir ingrediente a pendiente
  const handleReopenMapping = async (mappingId) => {
    setActionError(null);
    setFieldErrors({});
    setSubmitting(true);
    setSubmittingId(mappingId);

    const res = await reopenRunfoodMapping(mappingId);
    setSubmitting(false);
    setSubmittingId(null);

    if (res.ok) {
      const updated = res.data?.data || res.data;
      if (status === 'confirmed' || status === 'ignored') {
        paged.remove(mappingId);
      } else if (updated?.id) {
        paged.upsert(updated);
      }
      refreshCounts();
      showSuccess('Ingrediente reabierto a pendiente.');
      return { ok: true };
    }

    const errMsg = res.error || 'Error al reabrir ingrediente.';
    setActionError(errMsg);
    return { ok: false, error: errMsg };
  };

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
    successBanner,
    submitting,
    submittingId,
    handleAcceptSuggestion,
    handleUpdateMapping,
    handleIgnoreMapping,
    handleReopenMapping
  };
}
