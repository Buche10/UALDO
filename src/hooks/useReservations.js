import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createReservation,
  getReservation,
  getReservationAvailability,
  listReservations,
  updateReservation,
  todayGuayaquil,
} from '../services/reservationsClient';
import { generateClientUuid } from './useMovementSubmit';

const MAX_PAGES = 5;

/**
 * Reservas de un rango de fechas (Brief 39p). Lee hasta 5 páginas de 50 para
 * que la semana compacta no pierda días cuando hay muchas reservas.
 */
export function useReservationRange(from, to) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const collected = [];
    let page = 1;
    let lastPage = 1;
    while (page <= lastPage && page <= MAX_PAGES) {
      const res = await listReservations({ from, to, page });
      if (!res.ok) {
        if (mountedRef.current) {
          setError(res.error || 'No se pudieron cargar las reservas.');
          setLoading(false);
        }
        return;
      }
      collected.push(...(res.data?.data || []));
      lastPage = Number(res.data?.meta?.last_page) || 1;
      page += 1;
    }
    if (!mountedRef.current) return;
    setItems(collected);
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  return { items, setItems, loading, error, reload: load };
}

/** Número de reservas de un día para la tarjeta del módulo. */
export function useReservationsTodayCount(enabled, date = todayGuayaquil()) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let mounted = true;
    listReservations({ from: date, to: date })
      .then((res) => {
        if (!mounted || !res.ok) return;
        const total = res.data?.meta?.total;
        setCount(Number.isFinite(Number(total)) ? Number(total) : (res.data?.data || []).length);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [enabled, date]);

  return count;
}

/** Detalle de una reserva con recarga. */
export function useReservationDetail(reservationId) {
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(Boolean(reservationId));
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!reservationId) return null;
    setLoading(true);
    setError(null);
    const res = await getReservation(reservationId);
    setLoading(false);
    if (res.ok && res.data?.data) {
      setReservation(res.data.data);
      return res.data.data;
    }
    setError(res.error || 'No se pudo cargar la reserva.');
    return null;
  }, [reservationId]);

  useEffect(() => {
    if (reservationId) load();
  }, [reservationId, load]);

  return { reservation, setReservation, loading, error, reload: load };
}

/** Tabla de insumos comprometidos por los platos de una reserva. */
export function useReservationAvailability(reservation) {
  const [rows, setRows] = useState([]);
  const [horizonDays, setHorizonDays] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const dishes = reservation?.items || [];
    if (dishes.length === 0) {
      setRows([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await getReservationAvailability(dishes);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'No se pudo consultar el comprometido.');
      return;
    }
    setRows(res.data?.data || []);
    setHorizonDays(res.data?.horizon_days ?? null);
  }, [reservation]);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, horizonDays, loading, error, reload: load };
}

/**
 * Alta y edición de una reserva. El client_uuid se mantiene estable mientras
 * se reintenta el mismo formulario y se renueva tras un guardado exitoso.
 */
export function useReservationSubmit({ reservationId, onSaved } = {}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const uuidRef = useRef(generateClientUuid());
  const busyRef = useRef(false);

  const submit = async (data) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    const payload = { ...data, client_uuid: uuidRef.current };
    const res = reservationId ? await updateReservation(reservationId, data) : await createReservation(payload);
    busyRef.current = false;
    setSubmitting(false);
    if (res.ok) {
      uuidRef.current = generateClientUuid();
      if (onSaved) {
        onSaved(res.data?.data, res.data?.warnings || [], res.data?.suggestions || []);
      }
      return true;
    }
    setFieldErrors(res.data?.errors || {});
    setError(res.data?.message || res.error || 'No se pudo guardar la reserva.');
    return false;
  };

  return { submitting, error, fieldErrors, submit, clearError: () => { setError(null); setFieldErrors({}); } };
}
