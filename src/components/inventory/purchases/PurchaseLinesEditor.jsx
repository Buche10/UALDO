import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { styles } from './purchaseUi';
import ItemSearch from './ItemSearch';

function LineRow({ line, errors, onChange, onRemove, disabled }) {
  if (line.is_other) {
    const base = `other-${line.key}`;
    return (
      <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', color: 'var(--accent)' }}>
            Otras compras
          </span>
          <button type="button" aria-label="Quitar otra compra" onClick={() => onRemove(line.key)} disabled={disabled} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '4px' }}>
            <Trash2 size={16} />
          </button>
        </div>

        <div>
          <label htmlFor={`${base}-name`} style={styles.label}>Nombre</label>
          <input id={`${base}-name`} type="text" placeholder="Ej. Servilletas especiales" value={line.free_text_name || ''} disabled={disabled} onChange={(e) => onChange(line.key, 'free_text_name', e.target.value)} style={styles.input} />
          <span aria-live="polite" style={styles.fieldError}>{errors?.free_text_name || null}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <label htmlFor={`${base}-unit`} style={styles.label}>Unidad</label>
            <input id={`${base}-unit`} type="text" placeholder="unidad" value={line.unit || ''} disabled={disabled} onChange={(e) => onChange(line.key, 'unit', e.target.value)} style={styles.input} />
            <span aria-live="polite" style={styles.fieldError}>{errors?.unit || null}</span>
          </div>
          <div>
            <label htmlFor={`${base}-qty`} style={styles.label}>Cantidad</label>
            <input id={`${base}-qty`} type="text" inputMode="decimal" placeholder="1" value={line.quantity || ''} disabled={disabled} onChange={(e) => onChange(line.key, 'quantity', e.target.value)} style={styles.input} />
            <span aria-live="polite" style={styles.fieldError}>{errors?.quantity || null}</span>
          </div>
          <div>
            <label htmlFor={`${base}-total`} style={styles.label}>Total (USD)</label>
            <input id={`${base}-total`} type="text" inputMode="decimal" placeholder="0.00" value={line.line_total || ''} disabled={disabled} onChange={(e) => onChange(line.key, 'line_total', e.target.value)} style={styles.input} />
            <span aria-live="polite" style={styles.fieldError}>{errors?.line_total || null}</span>
          </div>
        </div>

        <div>
          <label htmlFor={`${base}-note`} style={styles.label}>Motivo (obligatorio)</label>
          <input id={`${base}-note`} type="text" maxLength={255} placeholder="Motivo de la compra" value={line.note || ''} disabled={disabled} onChange={(e) => onChange(line.key, 'note', e.target.value)} style={styles.input} />
          <span aria-live="polite" style={styles.fieldError}>{errors?.note || null}</span>
        </div>
      </div>
    );
  }

  const base = `purchase-${line.item?.id}`;
  return (
    <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{line.item?.name || `Insumo ${line.item?.id}`}</strong>
        <button type="button" aria-label={`Quitar ${line.item?.name || line.item?.id}`} onClick={() => onRemove(line.key)} disabled={disabled} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '4px' }}>
          <Trash2 size={16} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label htmlFor={`${base}-qty`} style={styles.label}>Cantidad ({line.item?.unit || 'unidad'})</label>
          <input id={`${base}-qty`} type="text" inputMode="decimal" value={line.quantity} disabled={disabled} onChange={(e) => onChange(line.key, 'quantity', e.target.value)} style={styles.input} />
          <span aria-live="polite" style={styles.fieldError}>{errors?.quantity || errors?.item_id || null}</span>
        </div>
        <div>
          <label htmlFor={`${base}-total`} style={styles.label}>Total pagado (USD)</label>
          <input id={`${base}-total`} type="text" inputMode="decimal" value={line.line_total} disabled={disabled} onChange={(e) => onChange(line.key, 'line_total', e.target.value)} style={styles.input} />
          <span aria-live="polite" style={styles.fieldError}>{errors?.line_total || null}</span>
        </div>
      </div>
      <div>
        <label htmlFor={`${base}-note`} style={styles.label}>Nota (opcional)</label>
        <input id={`${base}-note`} type="text" maxLength={255} value={line.note} disabled={disabled} onChange={(e) => onChange(line.key, 'note', e.target.value)} style={styles.input} />
      </div>
    </div>
  );
}

export default function PurchaseLinesEditor({ lines, lineErrors, onAddItem, onAddOther, onChange, onRemove, disabled }) {
  const [focusItemId, setFocusItemId] = useState(null);

  useEffect(() => {
    if (focusItemId === null) return;
    document.getElementById(`purchase-${focusItemId}-qty`)?.focus();
    setFocusItemId(null);
  }, [focusItemId, lines]);

  const pick = (item) => {
    onAddItem(item);
    setFocusItemId(item.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <ItemSearch onPick={pick} onAddOther={onAddOther} disabled={disabled} />
      {lines.length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Todavía no hay líneas.</p>}
      {lines.map((line) => (
        <LineRow key={line.key} line={line} errors={lineErrors[line.key]} onChange={onChange} onRemove={onRemove} disabled={disabled} />
      ))}
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
        El total y el costo unitario los calcula el motor al guardar.
      </p>
    </div>
  );
}
