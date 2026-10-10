import { useState, useEffect, useRef, useCallback } from 'react';
import { listInventory } from '../services/inventoryClient';
import { getCount, saveCountLines } from '../services/inventoryCountsClient';
import { useCountSheetAutosave } from './useCountSheetAutosave';
import {
  collectDirtyLines,
  countValueError,
  dirtyItemIds,
  markSaved,
  normalizeCountValue,
  withValue,
} from './countSheetLines';

/** Mapa inicial de cantidades a partir de las líneas guardadas en el motor. */
function savedLinesMap(lines) {
  const map = {};
  (lines || []).forEach((line) => {
    const value = line.counted_quantity !== null && line.counted_quantity !== undefined ? String(line.counted_quantity) : '';
    map[line.item_id] = { counted_quantity: value, initial_saved_qty: value, isDirty: false };
  });
  return map;
}

/** Insumos activos que no son servicios, por categoría y nombre. */
function sortCountable(allItems) {
  return allItems
    .filter((i) => i.type !== 'service')
    .sort((a, b) => {
      const catA = a.category?.name || '';
      const catB = b.category?.name || '';
      return catA !== catB ? catA.localeCompare(catB) : (a.name || '').localeCompare(b.name || '');
    });
}

/**
 * Hook para la planilla de conteo físico de insumos (CountSheet).
 *
 * Los guardados se encolan: pedir un guardado mientras otro está en curso
 * espera a que termine y luego guarda lo que haya quedado pendiente. Nada se
 * guarda en localStorage: el avance vive en el motor.
 */
export function useCountSheet({ countId, onStatusChange }) {
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [countDetail, setCountDetail] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [lineErrors, setLineErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState(null);

  const quantitiesRef = useRef({});
  const queueRef = useRef(null);

  const commitQuantities = useCallback((next) => {
    quantitiesRef.current = next;
    setQuantities(next);
  }, []);

  const loadAllInventoryItems = useCallback(async () => {
    setLoadingItems(true);
    setItemsError(null);
    let page = 1;
    let totalPages = 1;
    let allItems = [];
    try {
      do {
        const res = await listInventory({ page, includeInactive: false });
        if (!res.ok || !res.data) {
          setItemsError(res?.error || 'Error al cargar catálogo de inventario.');
          setItems([]);
          return;
        }
        allItems = allItems.concat(res.data.items || res.data.data || []);
        totalPages = res.data.meta?.last_page || 1;
        setLoadingProgress(Math.min(100, Math.round((page / totalPages) * 100)));
        page++;
      } while (page <= totalPages);
      setItems(sortCountable(allItems));
    } catch {
      setItemsError('Error de conexión al cargar catálogo.');
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  const loadDetail = useCallback(async () => {
    const res = await getCount(countId);
    if (res.ok && res.data?.data) {
      const detail = res.data.data;
      setCountDetail(detail);
      if (onStatusChange) onStatusChange(detail.status);
      commitQuantities(savedLinesMap(detail.lines));
      setSaveStatus('saved');
      setLastSavedTime(new Date());
    }
  }, [countId, onStatusChange, commitQuantities]);

  useEffect(() => {
    if (countId) {
      loadAllInventoryItems();
      loadDetail();
    }
  }, [countId, loadAllInventoryItems, loadDetail]);

  const statusAfter = useCallback((invalid) => {
    if (Object.keys(invalid).length > 0) return 'invalid';
    return dirtyItemIds(quantitiesRef.current).length > 0 ? 'dirty' : 'saved';
  }, []);

  /** Un guardado: envía las líneas válidas pendientes. Devuelve true si no quedó nada pendiente. */
  const runSave = useCallback(async () => {
    const { dirtyEntries, sentMap, invalid } = collectDirtyLines(quantitiesRef.current);
    setLineErrors((prev) => ({ ...prev, ...invalid }));
    if (dirtyEntries.length === 0) {
      setSaveStatus(statusAfter(invalid));
      return Object.keys(invalid).length === 0;
    }

    setSaveStatus('saving');
    setSaveErrorMessage(null);
    const res = await saveCountLines(countId, dirtyEntries);
    if (!res.ok) {
      setSaveStatus('error');
      setSaveErrorMessage(res.error || res.data?.message || 'Error al guardar avance.');
      const serverErrors = res.lineErrors || (res.status === 422 && res.data?.errors) || {};
      setLineErrors((prev) => ({ ...prev, ...serverErrors, ...invalid }));
      return false;
    }

    commitQuantities(markSaved(quantitiesRef.current, sentMap));
    setLineErrors(invalid);
    setLastSavedTime(new Date());
    const status = statusAfter(invalid);
    setSaveStatus(status);
    return status === 'saved';
  }, [countId, commitQuantities, statusAfter]);

  // Sin guardado en curso, arranca ya; con uno en curso, espera a que termine y
  // guarda lo que haya quedado pendiente (nunca dos peticiones a la vez).
  const savePendingLines = useCallback(() => {
    const previous = queueRef.current;
    const next = previous ? previous.catch(() => false).then(() => runSave()) : runSave();
    queueRef.current = next;
    next.finally(() => {
      if (queueRef.current === next) queueRef.current = null;
    });
    return next;
  }, [runSave]);

  const hasPendingChanges = useCallback(() => dirtyItemIds(quantitiesRef.current).length > 0, []);
  const pendingCount = useCallback(() => dirtyItemIds(quantitiesRef.current).length, []);
  const { onLineChanged } = useCountSheetAutosave({ savePendingLines, hasPendingChanges, pendingCount });

  const updateQuantity = useCallback((itemId, value) => {
    const error = countValueError(normalizeCountValue(value));
    setLineErrors((prev) => {
      if (error) return { ...prev, [itemId]: [error] };
      if (!prev[itemId]) return prev;
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

    commitQuantities({ ...quantitiesRef.current, [itemId]: withValue(quantitiesRef.current[itemId], value) });
    setSaveStatus(dirtyItemIds(quantitiesRef.current).length > 0 ? 'dirty' : 'saved');
    onLineChanged();
  }, [commitQuantities, onLineChanged]);

  return {
    items,
    loadingItems,
    itemsError,
    retryLoadItems: loadAllInventoryItems,
    loadingProgress,
    countDetail,
    setCountDetail,
    quantities,
    lineErrors,
    saveStatus,
    lastSavedTime,
    saveErrorMessage,
    updateQuantity,
    savePendingLines,
    hasPendingChanges,
    reloadDetail: loadDetail,
  };
}
