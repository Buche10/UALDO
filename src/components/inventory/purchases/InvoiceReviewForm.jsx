import React, { useState } from 'react';
import { AlertCircle, Save } from 'lucide-react';
import { confirmInvoice } from '../../../services/purchaseDocumentsClient';
import InvoiceReviewHeader from './InvoiceReviewHeader';
import InvoiceReviewLine from './InvoiceReviewLine';
import { styles } from './purchaseUi';

const LINE_FIELDS = ['quantity', 'line_total', 'unit_factor', 'free_text_name', 'unit', 'note'];

function toReviewLine(line, index) {
  const isOther = !line.item_id;
  return {
    key: `invoice:${index}`,
    source_index: index,
    description: line.description || '',
    code: line.code || '',
    read_quantity: line.quantity || '',
    read_unit: line.unit || '',
    unit_price: line.unit_price || '',
    quantity: line.quantity ?? '',
    line_total: line.line_total ?? '',
    item_id: line.item_id || null,
    item_name: line.item_name || line.suggested_item_name || '',
    is_other: isOther,
    free_text_name: isOther ? (line.description || '') : '',
    unit: line.unit || 'unidad',
    note: '',
    unit_factor: '',
    needs_review: Boolean(line.needs_review),
    review_reasons: Array.isArray(line.review_reasons) ? line.review_reasons : [],
    reviewed: !line.needs_review,
  };
}

function toConfirmLine(line) {
  const base = {
    source_index: line.source_index,
    quantity: line.quantity,
    line_total: line.line_total,
  };
  if (String(line.unit_factor || '').trim()) base.unit_factor = String(line.unit_factor).trim();
  if (line.is_other) {
    return { ...base, is_other: true, free_text_name: line.free_text_name, note: line.note, unit: line.unit || 'unidad' };
  }
  return { ...base, item_id: line.item_id };
}

/**
 * Revisión y confirmación del borrador propuesto por el motor (Brief 34ap).
 * La reutiliza el Brief 34bp.
 */
export default function InvoiceReviewForm({ document, onConfirmed, disabled }) {
  const extraction = document.extraction || {};
  const headerReasons = Array.isArray(extraction.header_review_reasons) ? extraction.header_review_reasons : [];
  const [lines, setLines] = useState(() => (extraction.lines || []).map(toReviewLine));
  const [supplier, setSupplier] = useState(() => (extraction.supplier_id ? {
    id: extraction.supplier_id,
    name: extraction.supplier_name || `Proveedor ${extraction.supplier_id}`,
    tax_id: extraction.supplier_tax_id,
  } : null));
  const [headerReviewed, setHeaderReviewed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const updateLine = (key, field, value) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, [field]: value, reviewed: false } : line)));
  };

  const pickItem = (key, item) => {
    setLines((prev) => prev.map((line) => (line.key === key ? {
      ...line,
      is_other: false,
      item_id: item.id,
      item_name: item.name,
      unit: item.unit || line.unit,
      reviewed: false,
    } : line)));
  };

  const toggleOther = (key) => {
    setLines((prev) => prev.map((line) => {
      if (line.key !== key) return line;
      const nextOther = !line.is_other;
      return {
        ...line,
        is_other: nextOther,
        free_text_name: nextOther ? (line.free_text_name || line.description) : line.free_text_name,
        reviewed: false,
      };
    }));
  };

  const markReviewed = (key, reviewed) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, reviewed } : line)));
  };

  const removeLine = (key) => setLines((prev) => prev.filter((line) => line.key !== key));

  const pendingReview = lines.some((line) => line.needs_review && !line.reviewed);
  const headerPending = headerReasons.length > 0 && !headerReviewed;
  const canConfirm = Boolean(supplier?.id) && lines.length > 0 && !pendingReview && !headerPending && !saving && !disabled;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setSaving(true);
    setError(null);
    const res = await confirmInvoice(document.id, {
      supplier_id: supplier.id,
      lines: lines.map(toConfirmLine),
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error || 'No se pudo confirmar la compra.');
      return;
    }
    onConfirmed(res.purchase || res.data);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <InvoiceReviewHeader
        extraction={extraction}
        supplier={supplier}
        onSupplierChange={setSupplier}
        headerReviewed={headerReviewed}
        onHeaderReviewedChange={setHeaderReviewed}
        disabled={saving}
      />

      {lines.length === 0 && <p style={{ ...styles.muted, padding: '16px' }}>La factura no trajo líneas.</p>}
      {lines.map((line, index) => (
        <InvoiceReviewLine
          key={line.key}
          line={line}
          index={index}
          onChange={(key, field, value) => {
            if (LINE_FIELDS.includes(field)) updateLine(key, field, value);
          }}
          onPickItem={pickItem}
          onToggleOther={toggleOther}
          onRemove={removeLine}
          onMarkReviewed={markReviewed}
          disabled={saving}
        />
      ))}

      <div aria-live="polite">{error && <div style={styles.errorBox}>{error}</div>}</div>
      {!canConfirm && !saving && (
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={13} />
          <span>Elige el proveedor y marca como revisadas las líneas pendientes.</span>
        </p>
      )}
      <button type="button" onClick={handleConfirm} disabled={!canConfirm} className="btn-primary" style={{ padding: '12px', borderRadius: '9999px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <Save size={15} />
        <span>{saving ? 'Confirmando...' : 'Confirmar compra'}</span>
      </button>
    </div>
  );
}
