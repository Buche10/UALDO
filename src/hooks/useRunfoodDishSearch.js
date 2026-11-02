import { useEffect, useRef, useState } from 'react';
import { listRunfoodRecipes } from '../services/runfoodCatalogClient';

const DEBOUNCE_MS = 300;

/**
 * Buscador de platos de RunFood por receta (Brief 39p). Devuelve el artículo
 * final de cada receta, que es el que se guarda en la reserva.
 */
export function useRunfoodDishSearch(term) {
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
      const res = await listRunfoodRecipes({ search: query.slice(0, 60), per_page: 20 });
      if (latestRef.current !== query) return;
      const rows = res.ok ? (res.data?.data || []) : [];
      const seen = new Set();
      const dishes = [];
      rows.forEach((row) => {
        const article = row?.articulo_final;
        const id = Number(article?.runfood_id);
        if (!id || seen.has(id)) return;
        seen.add(id);
        dishes.push({ runfood_article_id: id, name: article.descripcion || 'Plato sin nombre' });
      });
      setResults(dishes);
      setFailed(!res.ok);
      setSearching(false);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  useEffect(() => () => { latestRef.current = null; }, []);

  return { results, searching, failed };
}
