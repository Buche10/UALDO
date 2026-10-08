import { useState, useCallback } from 'react';
import {
  getClose,
  reviewClose,
  setNetosReales,
  reopenClose,
  reevaluateClose
} from '../services/cashCloseClient';

/**
 * Hook para manejar la carga del dia, revision, carga de netos reales, reapertura y reevaluacion.
 *
 * @param {Object} options
 * @param {string} options.fecha
 * @param {Function} [options.onUpdated]
 * @param {Function} [options.onReload]
 */
export function useCashClose({ fecha, onUpdated, onReload } = {}) {
  const [cierre, setCierre] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [fallasModal, setFallasModal] = useState(null);
  const [reevaluating, setReevaluating] = useState(false);
  const [reevaluateError, setReevaluateError] = useState(null);

  const fetchClose = useCallback(async (targetFecha = fecha) => {
    if (!targetFecha) return null;
    setLoading(true);
    setError(null);
    const res = await getClose(targetFecha);
    setLoading(false);

    if (res.ok) {
      const item = Array.isArray(res.data?.data)
        ? res.data.data[0] || null
        : res.data?.data || res.data || null;
      setCierre(item);
      if (onUpdated) onUpdated(item);
      return item;
    } else {
      setError(res.error || 'Error al cargar el detalle del cierre.');
      return null;
    }
  }, [fecha, onUpdated]);

  const submitReview = async (payload, targetFecha = fecha) => {
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    const res = await reviewClose(targetFecha, payload);
    setSubmitting(false);

    if (res.ok) {
      const updated = res.data?.data || res.data;
      setCierre(updated);
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('ualdo:notifications-updated'));
      }
      if (onUpdated) onUpdated(updated);
      return { ok: true, data: updated };
    }

    if (res.status === 422) {
      if (res.data?.fallas) {
        setFallasModal({ fallas: res.data.fallas, message: res.data.message });
        if (onReload) onReload();
        return { ok: false, fallas: res.data.fallas, message: res.data.message };
      }
      if (res.data?.errors) setFieldErrors(res.data.errors);
      const msg = res.data?.message || res.error || 'Datos no válidos.';
      setError(msg);
      return { ok: false, error: msg, errors: res.data?.errors };
    }

    const msg = res.error || 'Error al guardar el cierre.';
    setError(msg);
    return { ok: false, error: msg };
  };

  const submitNetosReales = async (netos, targetFecha = fecha) => {
    setSubmitting(true);
    setError(null);
    const res = await setNetosReales(targetFecha, netos);
    setSubmitting(false);

    if (res.ok) {
      const updated = res.data?.data || res.data;
      setCierre(updated);
      if (onUpdated) onUpdated(updated);
      return { ok: true, data: updated };
    }

    const msg = res.error || 'Error al guardar netos reales.';
    setError(msg);
    return { ok: false, error: msg };
  };

  const submitReopen = async (motivo, targetFecha = fecha) => {
    setSubmitting(true);
    setError(null);
    const res = await reopenClose(targetFecha, motivo);
    setSubmitting(false);

    if (res.ok) {
      const updated = res.data?.data || res.data;
      setCierre(updated);
      if (onUpdated) onUpdated(updated);
      return { ok: true, data: updated };
    }

    const msg = res.error || 'Error al reabrir el día.';
    setError(msg);
    return { ok: false, error: msg };
  };

  const triggerReevaluate = async (targetFecha = fecha) => {
    setReevaluating(true);
    setReevaluateError(null);
    const res = await reevaluateClose(targetFecha);
    setReevaluating(false);

    if (res.ok) {
      const updated = res.data?.data || res.data;
      setCierre(updated);
      if (onUpdated) onUpdated(updated);
      return { ok: true, data: updated };
    }

    const msg = res.error || 'Error al reevaluar el día.';
    setReevaluateError(msg);
    return { ok: false, error: msg, status: res.status };
  };

  return {
    cierre,
    setCierre,
    loading,
    error,
    setError,
    submitting,
    fieldErrors,
    setFieldErrors,
    fallasModal,
    setFallasModal,
    reevaluating,
    reevaluateError,
    setReevaluateError,
    fetchClose,
    submitReview,
    submitNetosReales,
    submitReopen,
    triggerReevaluate
  };
}
