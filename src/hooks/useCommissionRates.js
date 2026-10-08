import { useState, useEffect, useCallback } from 'react';
import {
  getCommissionRates,
  saveCommissionRate
} from '../services/cashConfigClient';
import { percentToBp } from '../services/money';

/**
 * Hook para manejar tasas de comision y retencion de tarjetas y su historial.
 */
export function useCommissionRates() {
  const [current, setCurrent] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  // Modal para agregar nueva tasa
  const [selectedCard, setSelectedCard] = useState(null);
  const [ratePercent, setRatePercent] = useState('');
  const [retentionPercent, setRetentionPercent] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [confirmModal, setConfirmModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Modal para ver historial
  const [historyCard, setHistoryCard] = useState(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getCommissionRates();
    setLoading(false);

    if (res.ok) {
      setCurrent(Array.isArray(res.data?.current) ? res.data.current : []);
      setHistory(Array.isArray(res.data?.history) ? res.data.history : []);
    } else {
      setError(res.error || 'Error al cargar tasas de comisión.');
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const openNewRateModal = (card) => {
    setSelectedCard(card);
    setRatePercent('');
    setRetentionPercent('');
    setEffectiveFrom(new Date().toISOString().slice(0, 10));
    setConfirmModal(false);
    setFieldErrors({});
    setError(null);
  };

  const closeNewRateModal = () => {
    setSelectedCard(null);
    setRatePercent('');
    setRetentionPercent('');
    setConfirmModal(false);
    setFieldErrors({});
  };

  const openHistoryModal = (card) => {
    setHistoryCard(card);
  };

  const closeHistoryModal = () => {
    setHistoryCard(null);
  };

  const validateForm = () => {
    const errors = {};
    const rateBp = percentToBp(ratePercent);
    if (rateBp === null) {
      errors.rate = 'Comisión inválida (0 a 30 % con máx 2 decimales).';
    }

    const retentionBp = percentToBp(retentionPercent);
    if (retentionBp === null) {
      errors.retention = 'Retención inválida (0 a 30 % con máx 2 decimales).';
    }

    if (!effectiveFrom) {
      errors.effective_from = 'Fecha de vigencia requerida.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const proceedToConfirm = () => {
    if (validateForm()) {
      setConfirmModal(true);
    }
  };

  const submitRate = async () => {
    if (!selectedCard) return;

    const rate_bp = percentToBp(ratePercent);
    const retention_bp = percentToBp(retentionPercent);

    setSubmitting(true);
    setError(null);
    const res = await saveCommissionRate({
      card_type: selectedCard.card_type,
      rate_bp,
      retention_bp,
      effective_from: effectiveFrom
    });
    setSubmitting(false);

    if (res.ok) {
      setCurrent(Array.isArray(res.data?.current) ? res.data.current : []);
      setHistory(Array.isArray(res.data?.history) ? res.data.history : []);
      closeNewRateModal();
      setSuccessBanner('Tasa guardada correctamente.');
      setTimeout(() => setSuccessBanner(null), 4000);
      return { ok: true, data: res.data };
    } else {
      if (res.data?.errors) {
        const errs = { ...res.data.errors };
        if (errs.rate_bp && !errs.rate) errs.rate = Array.isArray(errs.rate_bp) ? errs.rate_bp[0] : errs.rate_bp;
        if (errs.retention_bp && !errs.retention) errs.retention = Array.isArray(errs.retention_bp) ? errs.retention_bp[0] : errs.retention_bp;
        setFieldErrors(errs);
      }
      setConfirmModal(false);
      const msg = res.data?.message || res.error || 'Error al guardar la tasa.';
      setError(msg);
      return { ok: false, error: msg };
    }
  };

  return {
    current,
    history,
    loading,
    error,
    setError,
    successBanner,
    selectedCard,
    ratePercent,
    setRatePercent,
    retentionPercent,
    setRetentionPercent,
    effectiveFrom,
    setEffectiveFrom,
    confirmModal,
    setConfirmModal,
    fieldErrors,
    submitting,
    historyCard,
    fetchRates,
    openNewRateModal,
    closeNewRateModal,
    openHistoryModal,
    closeHistoryModal,
    proceedToConfirm,
    submitRate
  };
}
