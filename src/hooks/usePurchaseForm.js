import { useCallback, useRef, useState } from 'react';
import { createPurchase } from '../services/purchasesClient';
import { generateClientUuid } from './useMovementSubmit';
import { addItem, mapLineErrors, removeLine, toPayloadLines, updateLine } from './purchaseLines';

/** Fecha de hoy en el teléfono, como AAAA-MM-DD. */
export function todayIso(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Líneas editables de una compra, compartidas por el alta y por "Editar
 * líneas". Al cambiar una línea se borran sus errores.
 */
export function useLinesState(initialLines = []) {
  const [lines, setLines] = useState(initialLines);
  const [lineErrors, setLineErrors] = useState({});

  const onAddItem = useCallback((item) => setLines((prev) => addItem(prev, item)), []);
  const onRemove = useCallback((key) => setLines((prev) => removeLine(prev, key)), []);
  const onChange = useCallback((key, field, value) => {
    setLines((prev) => updateLine(prev, key, field, value));
    setLineErrors((prev) => {
      if (!prev[key]?.[field]) return prev;
      const rest = { ...prev[key] };
      delete rest[field];
      return { ...prev, [key]: rest };
    });
  }, []);

  return { lines, lineErrors, setLineErrors, onAddItem, onRemove, onChange };
}

/** Clave del error del motor para cada campo de la cabecera. */
const HEADER_ERROR_KEYS = { supplierId: 'supplier_id', purchasedOn: 'purchased_on', invoiceNumber: 'invoice_number' };

/**
 * Alta de una compra en borrador (Brief 20p). El client_uuid se genera al
 * abrir, se reutiliza tras un error de red y se renueva tras un 201 o un 200.
 */
export function usePurchaseForm({ onCreated }) {
  const [header, setHeader] = useState({ supplierId: '', location: 'warehouse', purchasedOn: todayIso(), invoiceNumber: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const uuidRef = useRef(generateClientUuid());
  const linesState = useLinesState();

  const setField = useCallback((field, value) => {
    setHeader((prev) => ({ ...prev, [field]: value }));
    const errorKey = HEADER_ERROR_KEYS[field] || field;
    setErrors((prev) => {
      if (!prev[errorKey]) return prev;
      const next = { ...prev };
      delete next[errorKey];
      return next;
    });
  }, []);

  const submit = async () => {
    if (submitting) return;
    setError(null);
    setErrors({});
    linesState.setLineErrors({});
    setSubmitting(true);
    const res = await createPurchase({ ...header, lines: toPayloadLines(linesState.lines) }, uuidRef.current);
    setSubmitting(false);

    if (res.ok) {
      uuidRef.current = generateClientUuid();
      if (onCreated) onCreated(res.data?.data, res.status === 200);
      return;
    }
    if (res.isNetworkError) {
      setError('Sin conexión. La compra no se registró; vuelve a intentarlo.');
      return;
    }
    const mapped = mapLineErrors(res.data?.errors, linesState.lines);
    linesState.setLineErrors(mapped.byLine);
    setErrors(mapped.general);
    setError(res.data?.message || res.error || 'No se pudo registrar la compra.');
  };

  return { header, setField, ...linesState, errors, error, submitting, submit };
}
