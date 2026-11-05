import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  listPaymentMappings,
  assignBucket,
  acceptSuggestion
} from '../services/cashConfigClient';

const porFormaPago = (a, b) => Number(a.runfood_forma_pago_id || 0) - Number(b.runfood_forma_pago_id || 0);

/** Una forma está en uso si cobró algo en los últimos días o ya tiene casilla. */
const estaEnUso = (m) => m.ultimo_arqueo != null || m.bucket !== 'sin_mapear';

/** Prioridad dentro de "Con cobros": primero lo que pide acción, luego las sugerencias. */
const prioridad = (m) => {
  if (m.bucket === 'sin_mapear' && m.ultimo_arqueo != null) return 0;
  if (m.suggested_bucket && !m.confirmado) return 1;
  return 2;
};

/**
 * Separa las formas de pago en las que el local usa (con cobros recientes o con
 * casilla) y el resto del catálogo de RunFood (Brief 43p). Función pura.
 *
 * @param {Array<Object>} mappings
 * @returns {{ enUso: Array<Object>, otras: Array<Object> }}
 */
export function groupMappings(mappings) {
  const lista = Array.isArray(mappings) ? mappings : [];

  const enUso = lista
    .filter(estaEnUso)
    .sort((a, b) => prioridad(a) - prioridad(b) || porFormaPago(a, b));

  const otras = lista
    .filter((m) => !estaEnUso(m))
    .sort(porFormaPago);

  return { enUso, otras };
}

/**
 * Hook para manejar la lista y actualizacion de mapeos de formas de pago de RunFood.
 */
export function usePaymentMappings() {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  // Estados para modal de cambio de cubeta
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [targetBucket, setTargetBucket] = useState('');
  const [confirmStep, setConfirmStep] = useState(null); // 'reassign' | 'ignore' | null
  const [submitting, setSubmitting] = useState(false);

  const fetchMappings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await listPaymentMappings();
    setLoading(false);

    if (res.ok) {
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setMappings(data);
    } else {
      setError(res.error || 'Error al cargar formas de pago.');
    }
  }, []);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  const { enUso, otras } = useMemo(() => groupMappings(mappings), [mappings]);

  const handleAcceptSuggestion = async (mapping) => {
    setError(null);
    setSubmitting(true);
    const res = await acceptSuggestion(mapping.id);
    setSubmitting(false);

    if (res.ok) {
      const updated = res.data?.data || res.data;
      setMappings(prev => prev.map(m => (m.id === mapping.id ? updated : m)));
      setSuccessBanner('Guardado. Los días abiertos se vuelven a evaluar en unos segundos.');
      setTimeout(() => setSuccessBanner(null), 4000);
      return { ok: true, data: updated };
    } else {
      const msg = res.error || 'Error al aceptar sugerencia.';
      setError(msg);
      return { ok: false, error: msg };
    }
  };

  const openChangeModal = (mapping) => {
    setSelectedMapping(mapping);
    setTargetBucket(mapping.bucket === 'sin_mapear' ? 'efectivo' : mapping.bucket);
    setConfirmStep(null);
    setError(null);
  };

  const closeChangeModal = () => {
    setSelectedMapping(null);
    setTargetBucket('');
    setConfirmStep(null);
  };

  const applyBucketAssignment = async () => {
    if (!selectedMapping || !targetBucket) return;
    setError(null);
    setSubmitting(true);
    const res = await assignBucket(selectedMapping.id, targetBucket);
    setSubmitting(false);

    if (res.ok) {
      const updated = res.data?.data || res.data;
      setMappings(prev => prev.map(m => (m.id === selectedMapping.id ? updated : m)));
      closeChangeModal();
      setSuccessBanner('Guardado. Los días abiertos se vuelven a evaluar en unos segundos.');
      setTimeout(() => setSuccessBanner(null), 4000);
      return { ok: true, data: updated };
    } else {
      const msg = res.error || 'Error al asignar forma de pago.';
      setError(msg);
      return { ok: false, error: msg };
    }
  };

  const confirmAndSave = async () => {
    if (!selectedMapping) return;

    if (targetBucket === 'ignorar' && confirmStep !== 'ignore') {
      setConfirmStep('ignore');
      return;
    }

    if (selectedMapping.confirmado && confirmStep !== 'reassign' && confirmStep !== 'ignore') {
      setConfirmStep('reassign');
      return;
    }

    await applyBucketAssignment();
  };

  return {
    mappings,
    enUso,
    otras,
    loading,
    error,
    setError,
    successBanner,
    submitting,
    selectedMapping,
    targetBucket,
    setTargetBucket,
    confirmStep,
    setConfirmStep,
    fetchMappings,
    handleAcceptSuggestion,
    openChangeModal,
    closeChangeModal,
    confirmAndSave,
    applyBucketAssignment
  };
}
