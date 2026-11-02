import { useCallback, useRef, useState } from 'react';
import { recordRun } from '../services/productionClient';
import { generateClientUuid } from './useMovementSubmit';
import { useProductionPlan } from './useProductionPlan';
import { basisInput, buildPayload, emptyValues, inputKey, mapServerErrors, validateForm } from './productionForm';
import { DEFAULT_LOCATION } from '../services/inventoryLocations';
import { emptyLotSelection, lotSelectionError } from '../services/lotSelection';

/** Clave del error de cada campo del formulario. */
const FIELD_ERROR_KEYS = { mainOutputWeight: 'main_output_weight', wasteQuantity: 'waste_quantity' };

/**
 * Formulario de un porcionado (Brief 21p).
 *
 * El client_uuid se genera al abrir, se reutiliza tras un error de red y se
 * renueva tras un 201 o un 200. Un 409 muestra el mensaje del motor; un 422,
 * cada error junto a su campo.
 */
export function useProductionRunForm({ template, onRecorded }) {
  const [form, setForm] = useState(() => ({
    location: template?.default_location || DEFAULT_LOCATION,
    values: emptyValues(template),
    mainOutputWeight: '',
    wasteQuantity: '',
    notes: '',
    ...emptyLotSelection(),
    lotJustification: '',
    lotNeedsJustification: false,
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const uuidRef = useRef(generateClientUuid());

  const basis = basisInput(template);
  const basisValue = basis ? form.values[inputKey(basis.item_id)] : null;
  const plan = useProductionPlan(basis ? template.id : null, basisValue);

  const setValue = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, values: { ...prev.values, [key]: value } }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const setField = useCallback((field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'location' ? { ...emptyLotSelection(), lotJustification: '', lotNeedsJustification: false } : {}),
    }));
    const errorKey = FIELD_ERROR_KEYS[field] || field;
    setFieldErrors((prev) => {
      if (!prev[errorKey]) return prev;
      const next = { ...prev };
      delete next[errorKey];
      return next;
    });
  }, []);

  const setLotSelection = useCallback((selection = {}) => {
    setForm((prev) => ({
      ...prev,
      lotId: selection.lotId || '',
      lotJustification: selection.justification || '',
      lotNeedsJustification: Boolean(selection.needsJustification),
      recommendedCode: selection.recommendedCode || null,
      recommendedLotId: selection.recommendedLotId || null,
    }));
    setFieldErrors((prev) => {
      if (!prev.lot) return prev;
      const next = { ...prev };
      delete next.lot;
      return next;
    });
  }, []);

  const handleFailure = (res, payload) => {
    if (res.isNetworkError) {
      setError('Sin conexión. La producción no se registró; vuelve a intentarlo.');
    } else if (res.status === 422 && res.data?.errors) {
      setFieldErrors(mapServerErrors(res.data.errors, payload));
      setError(res.data?.message || 'Revisa los datos marcados.');
    } else {
      setError(res.data?.message || res.error || 'No se pudo registrar la producción.');
    }
  };

  const submit = async () => {
    if (submitting) return;
    setError(null);
    const errors = validateForm(template, form);
    const lotError = lotSelectionError({
      lotId: form.lotId,
      needsJustification: form.lotNeedsJustification,
      justification: form.lotJustification,
    });
    if (lotError) errors.lot = lotError;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Revisa los datos marcados.');
      return;
    }

    const payload = buildPayload(template, form);
    setSubmitting(true);
    const res = await recordRun(payload, uuidRef.current);
    setSubmitting(false);

    if (res.ok) {
      uuidRef.current = generateClientUuid();
      if (onRecorded) onRecorded(res.data?.data, res.data?.status === 'idempotent');
      return;
    }
    handleFailure(res, { inputs: payload.inputs, outputs: payload.outputs });
  };

  return {
    form,
    setValue,
    setField,
    setLotSelection,
    submit,
    submitting,
    error,
    fieldErrors,
    expected: plan.expected,
    planLoading: plan.loading,
    planFailed: plan.failed,
    scalesBySum: !basis,
    clientUuid: () => uuidRef.current,
  };
}
