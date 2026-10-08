import { useState, useEffect, useCallback } from 'react';
import { listMovements, voidMovement } from '../services/cashMovementsClient';
import { useCashMovementSubmit } from './useCashMovementSubmit';

/**
 * Hook para manejar la lista, paginacion, registro y anulacion de movimientos de caja.
 *
 * @param {Object} options
 * @param {string} options.fecha
 * @param {Function} [options.onMovementChanged]
 */
export function useCashMovements({ fecha, onMovementChanged }) {
  const [movements, setMovements] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [totals, setTotals] = useState({ gastos_diarios: 0, por_tipo: {} });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [movementToVoid, setMovementToVoid] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidSubmitting, setVoidSubmitting] = useState(false);
  const [voidError, setVoidError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  const [form, setForm] = useState({
    kind: 'pago_efectivo',
    counterparty: '',
    amount: '',
    note: ''
  });

  const loadData = useCallback(async (page = 1, append = false) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    const res = await listMovements(fecha, page);
    setLoading(false);
    setLoadingMore(false);

    if (res.ok) {
      const data = res.data?.data || [];
      setMovements(prev => append ? [...prev, ...data] : data);
      if (res.data?.meta) setMeta(res.data.meta);
      if (res.data?.totals) setTotals(res.data.totals);
    } else {
      setError(res.error || 'Error al cargar los movimientos.');
    }
  }, [fecha]);

  useEffect(() => {
    loadData(1, false);
  }, [loadData]);

  const { submitting, error: submitError, fieldErrors, submitMovement, initUuid } = useCashMovementSubmit({
    businessDate: fecha,
    onSuccess: ({ message }) => {
      setSuccessBanner(message);
      setShowAddModal(false);
      setForm({ kind: 'pago_efectivo', counterparty: '', amount: '', note: '' });
      loadData(1, false);
      if (onMovementChanged) onMovementChanged();
      setTimeout(() => setSuccessBanner(null), 3000);
    }
  });

  const openAddModal = () => {
    initUuid();
    setSuccessBanner(null);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const submitAdd = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    return submitMovement(form);
  };

  const openVoidModal = (movement) => {
    setMovementToVoid(movement);
    setVoidReason('');
    setVoidError(null);
    setShowVoidModal(true);
  };

  const closeVoidModal = () => {
    setShowVoidModal(false);
  };

  const submitVoid = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!movementToVoid) return;
    const trimmed = voidReason.trim();
    if (!trimmed) {
      setVoidError('El motivo de anulación es obligatorio.');
      return;
    }

    setVoidSubmitting(true);
    const res = await voidMovement(movementToVoid.id, trimmed);
    setVoidSubmitting(false);

    if (res.ok) {
      setShowVoidModal(false);
      setSuccessBanner('Movimiento anulado.');
      loadData(1, false);
      if (onMovementChanged) onMovementChanged();
      setTimeout(() => setSuccessBanner(null), 3000);
    } else {
      setVoidError(res.data?.message || res.error || 'Error al anular movimiento.');
    }
  };

  return {
    movements,
    meta,
    totals,
    loading,
    loadingMore,
    error,
    showAddModal,
    showVoidModal,
    movementToVoid,
    voidReason,
    setVoidReason,
    voidSubmitting,
    voidError,
    successBanner,
    form,
    setForm,
    submitting,
    submitError,
    fieldErrors,
    loadData,
    openAddModal,
    closeAddModal,
    submitAdd,
    openVoidModal,
    closeVoidModal,
    submitVoid
  };
}
