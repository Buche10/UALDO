import { useState, useEffect, useCallback } from 'react';
import {
  listPaymentMappings,
  assignBucket,
  acceptSuggestion
} from '../services/cashConfigClient';

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

  const sortedMappings = [...mappings].sort((a, b) => {
    const aUnmapped = a.bucket === 'sin_mapear' ? 1 : 0;
    const bUnmapped = b.bucket === 'sin_mapear' ? 1 : 0;
    if (aUnmapped !== bUnmapped) return bUnmapped - aUnmapped;
    return Number(a.runfood_forma_pago_id || 0) - Number(b.runfood_forma_pago_id || 0);
  });

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
    mappings: sortedMappings,
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
