import { useState, useCallback, useEffect } from 'react';
import { listRunfoodRecipes } from '../services/runfoodCatalogClient';
import { usePagedList } from './usePagedList';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Hook para la consulta paginada y filtrada de recetas de RunFood (Brief 24p-fix).
 *
 * @param {{ initialEstado?: string, initialSearch?: string }} [options]
 */
export function useRunfoodRecipes({ initialEstado = '', initialSearch = '' } = {}) {
  const [estado, setEstado] = useState(initialEstado);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  // Debounce de búsqueda de 300 ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

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
    recipes: {
      items: paged.items,
      loading: paged.loading,
      error: paged.error,
      hasMore: paged.hasMore,
      loadMore: paged.loadMore,
      reload: paged.reload
    }
  };
}
