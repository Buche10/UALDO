import { useState, useEffect, useCallback } from 'react';
import { listCounts, createCount, cancelCount } from '../services/inventoryCountsClient';

/**
 * Hook para listar y gestionar conteos físicos por ubicación (dueño).
 */
export function useCounts({ isOwner }) {
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadCounts = useCallback(async (pageToLoad = 1, append = false) => {
    if (!isOwner) return;
    setLoading(true);
    setError(null);

    const res = await listCounts({
      location: locationFilter,
      status: statusFilter,
      page: pageToLoad,
    });
    setLoading(false);

    if (res.ok && res.data) {
      const list = res.data.data || [];
      // Los borradores primero
      const sorted = [...list].sort((a, b) => {
        if (a.status === 'draft' && b.status !== 'draft') return -1;
        if (a.status !== 'draft' && b.status === 'draft') return 1;
        return 0;
      });
      setCounts(prev => append ? [...prev, ...sorted] : sorted);
      const meta = res.data.meta || {};
      setHasMore(meta.current_page < meta.last_page);
      setPage(pageToLoad);
    } else {
      setError(res.error || 'Error al cargar conteos.');
    }
  }, [isOwner, locationFilter, statusFilter]);

  useEffect(() => {
    if (isOwner) {
      loadCounts(1, false);
    }
  }, [isOwner, loadCounts]);

  const handleCreateCount = async (location, notes) => {
    setError(null);
    const res = await createCount(location, notes);
    if (res.ok && res.data?.data) {
      const created = res.data.data;
      setCounts(prev => [created, ...prev]);
      return { ok: true, data: created };
    }
    return { ok: false, error: res.error || res.data?.message || 'Error al crear conteo.' };
  };

  const handleCancelCount = async (countId) => {
    setError(null);
    const res = await cancelCount(countId);
    if (res.ok) {
      setCounts(prev => prev.map(c => c.id === countId ? { ...c, status: 'cancelled' } : c));
      return { ok: true };
    }
    return { ok: false, error: res.error || res.data?.message || 'Error al cancelar conteo.' };
  };

  return {
    counts,
    loading,
    error,
    hasMore,
    loadMore: () => loadCounts(page + 1, true),
    reload: () => loadCounts(1, false),
    createCount: handleCreateCount,
    cancelCount: handleCancelCount,
    locationFilter,
    setLocationFilter,
    statusFilter,
    setStatusFilter,
  };
}
