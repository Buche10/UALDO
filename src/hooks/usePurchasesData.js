import { useCallback, useEffect, useState } from 'react';
import { createSupplier, getValuation, listPurchases, listSuppliers, updateSupplier } from '../services/purchasesClient';
import { usePagedList } from './usePagedList';

const SEARCH_DEBOUNCE_MS = 300;

/** Compras paginadas, con filtro por estado (Brief 20p). */
export function usePurchases(status) {
  const fetchPage = useCallback((page) => listPurchases({ status, page }), [status]);
  return usePagedList(fetchPage, { errorMessage: 'No se pudieron cargar las compras.' });
}

/** Valor que se actualiza 300 ms después del último cambio. */
export function useDebouncedValue(value, delay = SEARCH_DEBOUNCE_MS) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Proveedores paginados, con búsqueda (tras 300 ms) e inactivos (Brief 20p). */
export function useSuppliers({ search = '', includeInactive = false } = {}) {
  const term = useDebouncedValue(search);
  const fetchPage = useCallback((page) => listSuppliers({ search: term, includeInactive, page }), [term, includeInactive]);
  return usePagedList(fetchPage, { errorMessage: 'No se pudieron cargar los proveedores.' });
}

/** Alta o edición de un proveedor; el 422 queda por campo. */
export function useSupplierSave({ onSaved }) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);

  const save = async (supplierId, data) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    const res = supplierId ? await updateSupplier(supplierId, data) : await createSupplier(data);
    setSaving(false);
    if (res.ok) {
      setErrors({});
      if (onSaved) onSaved(res.data?.data);
      return;
    }
    const fieldErrors = {};
    Object.entries(res.data?.errors || {}).forEach(([key, value]) => { fieldErrors[key] = Array.isArray(value) ? value.join(' ') : String(value); });
    setErrors(fieldErrors);
    setError(res.data?.message || res.error || 'No se pudo guardar el proveedor.');
  };

  return { saving, errors, error, save };
}

export { useItemSearch } from './useItemSearch';

/** Valor del inventario por ubicación (Brief 20p). */
export function useValuation() {
  const [valuation, setValuation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getValuation();
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'No se pudo calcular el valor del inventario.');
      return;
    }
    setValuation(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { valuation, loading, error, reload: load };
}
