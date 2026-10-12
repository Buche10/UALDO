import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cancelRequest,
  createRequest,
  decideRequest,
  getRequest,
  getShoppingList,
  listRequests,
  markPurchased,
  markReceived,
} from '../services/supplyRequestsClient';
import { generateClientUuid } from './useMovementSubmit';
import { usePagedList } from './usePagedList';
import { addCatalogItem, addFreeItem, mapItemErrors, removeItem, toPayloadItems, updateItem } from './supplyRequestItems';

/** Pedidos paginados con filtro por estado (Brief 22p). El personal recibe solo los suyos. */
export function useSupplyRequests(status) {
  const fetchPage = useCallback((page) => listRequests({ status, page }), [status]);
  return usePagedList(fetchPage, { errorMessage: 'No se pudieron cargar los pedidos.' });
}

/** Detalle de un pedido pedido al motor, con carga, error y recarga. */
export function useSupplyRequestDetail(requestId) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryable, setRetryable] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getRequest(requestId);
    setLoading(false);
    if (res.ok && res.data?.data) {
      setRequest(res.data.data);
      return res.data.data;
    }
    // Un 403 o un 404 no se arreglan reintentando.
    setRetryable(res.status !== 403 && res.status !== 404);
    if (res.status === 403) setError('Solo el dueño o quien hizo el pedido pueden verlo.');
    else if (res.status === 404) setError('El pedido no existe en este negocio.');
    else setError(res.error || 'No se pudo cargar el pedido.');
    return null;
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  return { request, setRequest, loading, error, retryable, reload: load };
}

const ACTIONS = {
  approve: (id, note) => decideRequest(id, 'approved', note),
  reject: (id, note) => decideRequest(id, 'rejected', note),
  purchased: (id) => markPurchased(id),
  received: (id) => markReceived(id),
  cancel: (id) => cancelRequest(id),
};

/**
 * Transiciones de un pedido (Brief 22p). Un 409 explica el motivo del motor y
 * pide el estado real (`onStale`).
 */
export function useSupplyRequestActions({ requestId, onUpdated, onStale }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  // El estado `busy` se lee del render: un doble toque en el mismo render
  // pasaría el control. El ref lo bloquea de inmediato.
  const busyRef = useRef(false);

  const run = async (action, note) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setError(null);
    setBusy(action);
    const res = await ACTIONS[action](requestId, note);
    busyRef.current = false;
    setBusy(null);
    if (res.ok) {
      if (onUpdated) onUpdated(res.data?.data, action);
      return true;
    }
    const fallback = res.status === 409 ? 'El pedido cambió de estado: se cargó el estado actual.' : 'No se pudo completar la acción.';
    setError(res.data?.errors?.note?.[0] || res.data?.message || res.error || fallback);
    if (res.status === 409 && onStale) onStale();
    return false;
  };

  return { busy, error, run, clearError: () => setError(null) };
}

/** Lista de compras consolidada de lo aprobado y sin comprar (solo el dueño). */
export function useShoppingList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getShoppingList();
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'No se pudo cargar la lista de compras.');
      return;
    }
    setItems(res.data?.data || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load };
}

/** Líneas editables de un pedido, con sus errores por línea. */
function useRequestItems() {
  const [items, setItems] = useState([]);
  const [itemErrors, setItemErrors] = useState({});
  const sequenceRef = useRef(0);

  const addCatalog = useCallback((item) => setItems((prev) => addCatalogItem(prev, item)), []);
  /** Agrega una línea en texto libre y devuelve su clave (para mover el foco). */
  const addFree = useCallback(() => {
    sequenceRef.current += 1;
    const sequence = sequenceRef.current;
    setItems((prev) => addFreeItem(prev, sequence));
    return `free:${sequence}`;
  }, []);
  const remove = useCallback((key) => setItems((prev) => removeItem(prev, key)), []);
  const change = useCallback((key, field, value) => {
    setItems((prev) => updateItem(prev, key, field, value));
    setItemErrors((prev) => {
      if (!prev[key]?.[field]) return prev;
      const rest = { ...prev[key] };
      delete rest[field];
      return { ...prev, [key]: rest };
    });
  }, []);

  return { items, itemErrors, setItemErrors, addCatalog, addFree, remove, change };
}

/**
 * Alta de un pedido (Brief 22p). El client_uuid se genera al abrir, se
 * reutiliza tras un error de red y se renueva tras un 201 o un 200.
 */
export function useSupplyRequestForm({ onCreated }) {
  const [priority, setPriority] = useState('normal');
  const [note, setNote] = useState('');
  const lines = useRequestItems();
  const { items, setItemErrors } = lines;
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const uuidRef = useRef(generateClientUuid());

  const submit = async () => {
    if (submitting) return;
    setError(null);
    setErrors({});
    setItemErrors({});
    setSubmitting(true);
    const res = await createRequest({ priority, note, items: toPayloadItems(items) }, uuidRef.current);
    setSubmitting(false);
    if (res.ok) {
      uuidRef.current = generateClientUuid();
      if (onCreated) onCreated(res.data?.data, res.status === 200);
      return;
    }
    if (res.isNetworkError) {
      setError('Sin conexión. El pedido no se envió; vuelve a intentarlo.');
      return;
    }
    const mapped = mapItemErrors(res.data?.errors, items);
    setItemErrors(mapped.byItem);
    setErrors(mapped.general);
    setError(res.data?.message || res.error || 'No se pudo enviar el pedido.');
  };

  return { priority, setPriority, note, setNote, ...lines, errors, error, submitting, submit };
}
