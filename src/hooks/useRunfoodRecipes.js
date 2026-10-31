import { useState, useCallback, useEffect } from 'react';
import {
  listRunfoodRecipes,
  getRunfoodCoverage
} from '../services/runfoodCatalogClient';
import { usePagedList } from './usePagedList';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Hook para la consulta de recetas de RunFood y cobertura de ventas (Brief 24p).
 */
export function useRunfoodRecipes({ initialDays = 7 } = {}) {
  const [estado, setEstado] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [days, setDays] = useState(initialDays);

  // Estados de cobertura de ventas
  const [coverageData, setCoverageData] = useState(null);
  const [coverageLoading, setCoverageLoading] = useState(true);
  const [coverageError, setCoverageError] = useState(null);

  // Debounce de búsqueda de 300 ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Carga de cobertura de ventas
  const loadCoverage = useCallback(async (targetDays = days) => {
    setCoverageLoading(true);
    setCoverageError(null);
    const res = await getRunfoodCoverage({ days: targetDays });
    setCoverageLoading(false);

    if (res.ok) {
      setCoverageData(res.data);
    } else {
      setCoverageError(res.error || 'No se pudo cargar la cobertura de ventas.');
    }
  }, [days]);

  useEffect(() => {
    loadCoverage(days);
  }, [days, loadCoverage]);

  // Consulta paginada de recetas
  const fetchPage = useCallback(
    (page) => listRunfoodRecipes({
      estado: estado || undefined,
      search: debouncedSearch || undefined,
      page
    }),
    [estado, debouncedSearch]
  );

  const paged = usePagedList(fetchPage, {
    errorMessage: 'No se pudieron cargar las recetas.'
  });

  return {
    estado,
    setEstado,
    search,
    setSearch,
    days,
    setDays,
    recipes: {
      items: paged.items,
      loading: paged.loading,
      error: paged.error,
      hasMore: paged.hasMore,
      loadMore: paged.loadMore,
      reload: paged.reload
    },
    coverage: {
      data: coverageData,
      loading: coverageLoading,
      error: coverageError,
      reload: () => loadCoverage(days)
    }
  };
}
