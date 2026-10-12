import { useEffect, useRef, useState } from 'react';
import { listInventory } from '../services/inventoryClient';

const SEARCH_DEBOUNCE_MS = 300;

/** Insumos activos que no son servicios, buscados por nombre o código tras 300 ms. */
export function useItemSearch(term) {
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const latestRef = useRef('');

  useEffect(() => {
    const query = String(term || '').trim();
    latestRef.current = query;
    setFailed(false);
    if (query.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const res = await listInventory({ search: query });
      if (latestRef.current !== query) return;
      const list = res.ok ? (res.data?.items || res.data?.data || []) : [];
      setResults(list.filter((item) => item.type !== 'service'));
      setFailed(!res.ok);
      setSearching(false);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  useEffect(() => () => { latestRef.current = null; }, []);

  return { results, searching, failed };
}
