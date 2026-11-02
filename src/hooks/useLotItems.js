import { useCallback, useEffect, useRef, useState } from 'react';
import { listInventory } from '../services/inventoryClient';

const MAX_PAGES = 20;

/**
 * Insumos marcados con `requires_lot`. Recorre las páginas del catálogo para
 * no depender de que los cárnicos estén en la primera página.
 */
export function useLotItems({ enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      return;
    }
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    setError(null);

    let page = 1;
    let lastPage = 1;
    const found = [];
    while (page <= lastPage && page <= MAX_PAGES) {
      const res = await listInventory({ page, includeInactive: true });
      if (requestRef.current !== requestId) return;
      if (!res.ok) {
        setError(res.error || 'No se pudieron consultar los insumos con lote.');
        break;
      }
      const batch = res.data?.items || res.data?.data || [];
      batch.filter((item) => item.requires_lot).forEach((item) => found.push(item));
      lastPage = Number(res.data?.meta?.last_page) || 1;
      if (batch.length === 0) break;
      page += 1;
    }

    setItems(found);
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => () => {
    requestRef.current += 1;
  }, []);

  return {
    items,
    hasLotItems: items.length > 0,
    loading,
    error,
    reload: load,
  };
}
