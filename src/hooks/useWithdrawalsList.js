import { useState, useCallback, useEffect } from 'react';
import { listWithdrawals } from '../services/withdrawalsClient';

export function useWithdrawalsList() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(1);
    const res = await listWithdrawals({ page: 1 });
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'No se pudieron cargar los retiros.');
      return;
    }
    const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
    setWithdrawals(data);
    const meta = res.data?.meta;
    setHasMore(Boolean(meta && meta.current_page < meta.last_page));
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await listWithdrawals({ page: nextPage });
    setLoadingMore(false);
    if (!res.ok) return;

    const newItems = Array.isArray(res.data) ? res.data : res.data?.data || [];
    setWithdrawals((prev) => {
      const existing = new Set(prev.map((w) => w.id));
      const unique = newItems.filter((w) => !existing.has(w.id));
      return [...prev, ...unique];
    });
    setPage(nextPage);
    const meta = res.data?.meta;
    setHasMore(Boolean(meta && meta.current_page < meta.last_page));
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    withdrawals,
    loading,
    error,
    setError,
    hasMore,
    loadingMore,
    loadData,
    handleLoadMore,
  };
}
