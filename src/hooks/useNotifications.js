import { useState, useEffect, useCallback } from 'react';
import { listNotifications, markRead, markAllRead } from '../services/notificationsClient';

/**
 * Hook para la gestión de la lista de avisos, filtros, paginación y estado de lectura.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Filtros
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadNotifications = useCallback(async (page = 1, append = false) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    const res = await listNotifications({
      unread: unreadOnly ? 1 : null,
      category: categoryFilter,
      page,
    });

    if (page === 1) setLoading(false);
    else setLoadingMore(false);

    if (res.ok && res.data) {
      const items = res.data.data || [];
      setNotifications(prev => (append ? [...prev, ...items] : items));
      setMeta(res.data.meta || { current_page: 1, last_page: 1 });
    } else {
      setError(res.error || 'Error al cargar avisos.');
    }
  }, [unreadOnly, categoryFilter]);

  useEffect(() => {
    loadNotifications(1, false);
  }, [loadNotifications]);

  const handleMarkRead = async (notifId) => {
    const res = await markRead(notifId);
    if (res.ok) {
      setNotifications(prev =>
        prev.map(n => (n.id === notifId ? { ...n, read_at: new Date().toISOString() } : n))
      );
      window.dispatchEvent(new CustomEvent('ualdo:notifications-updated'));
      return { ok: true };
    }
    return { ok: false, error: res.error || 'No se pudo marcar el aviso como leído.' };
  };

  const handleMarkAllRead = async () => {
    const res = await markAllRead(categoryFilter || null);
    if (res.ok) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      window.dispatchEvent(new CustomEvent('ualdo:notifications-updated'));
      return { ok: true };
    }
    return { ok: false, error: res.error || 'No se pudo marcar todos los avisos como leídos.' };
  };

  const reload = () => loadNotifications(1, false);
  const loadNextPage = () => {
    if (!loadingMore && meta.current_page < meta.last_page) {
      loadNotifications(meta.current_page + 1, true);
    }
  };

  return {
    notifications,
    meta,
    loading,
    loadingMore,
    error,
    unreadOnly,
    setUnreadOnly,
    categoryFilter,
    setCategoryFilter,
    reload,
    loadNextPage,
    handleMarkRead,
    handleMarkAllRead,
  };
}
