import { useState, useEffect, useCallback, useRef } from 'react';
import { listInventory, fetchAlerts } from '../services/inventoryClient';

/**
 * Hook para manejar la lista de inventario, filtros, búsqueda debounced y alertas.
 */
export function useInventoryList() {
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [totals, setTotals] = useState({ count: 0, low_stock_count: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'low_stock' | 'alerts'
  const [includeInactive, setIncludeInactive] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const searchTimerRef = useRef(null);

  // Debounce búsqueda 300 ms con limpieza en ref
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [search]);

  const loadData = useCallback(async (pageToLoad = 1, append = false) => {
    if (pageToLoad === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      if (activeTab === 'alerts') {
        const resAlerts = await fetchAlerts();
        setLoading(false);
        if (resAlerts.ok && resAlerts.data) {
          setAlerts(resAlerts.data.alerts || []);
        } else {
          setError(resAlerts.error || 'Error al cargar alertas.');
        }
        return;
      }

      const res = await listInventory({
        search: debouncedSearch,
        low_stock: activeTab === 'low_stock',
        includeInactive,
        page: pageToLoad,
      });

      if (pageToLoad === 1) setLoading(false);
      else setLoadingMore(false);

      if (res.ok && res.data) {
        const fetchedItems = res.data.items || res.data.data || [];
        setItems(prev => (append ? [...prev, ...fetchedItems] : fetchedItems));
        setTotals(res.data.totals || { count: fetchedItems.length, low_stock_count: 0 });
        const meta = res.data.meta || {};
        setHasMore(meta.current_page < meta.last_page);
        setPage(pageToLoad);
      } else {
        setError(res.error || 'Error al cargar el inventario.');
      }
    } catch {
      setLoading(false);
      setLoadingMore(false);
      setError('Error de conexión al cargar datos.');
    }
  }, [activeTab, debouncedSearch, includeInactive]);

  useEffect(() => {
    loadData(1, false);
  }, [loadData]);

  const updateItemStock = (itemId, newStock) => {
    setItems(prev => prev.map(i => (i.id === itemId ? { ...i, stock: newStock } : i)));
  };

  const reload = () => loadData(1, false);
  const loadNextPage = () => {
    if (!loadingMore && hasMore) {
      loadData(page + 1, true);
    }
  };

  return {
    items,
    alerts,
    totals,
    loading,
    loadingMore,
    error,
    activeTab,
    setActiveTab,
    includeInactive,
    setIncludeInactive,
    search,
    setSearch,
    hasMore,
    reload,
    loadNextPage,
    updateItemStock,
  };
}
