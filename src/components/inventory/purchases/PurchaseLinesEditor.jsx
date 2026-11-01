import React, { useEffect, useState } from 'react';
import { Search, Trash2, Plus } from 'lucide-react';
import { useItemSearch } from '../../../hooks/usePurchasesData';
import { styles } from './purchaseUi';

function ItemSearch({ onPick, onAddOther, disabled }) {
  const [term, setTerm] = useState('');
  const { results, searching, failed } = useItemSearch(term);
  const query = term.trim();
  let status = null;
  if (searching) status = 'Buscando...';
  else if (failed) status = 'No se pudo buscar: revisa la conexión.';
  else if (query.length >= 2 && results.length === 0) status = `Sin resultados para "${query}".`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div>
        <label htmlFor="purchase-item-search" style={styles.label}>Agregar insumo</label>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input id="purchase-item-search" type="text" placeholder="Busca por nombre o código" value={term} disabled={disabled} onChange={(e) => setTerm(e.target.value)} style={{ ...styles.input, paddingLeft: '36px' }} />
        </div>
        <div aria-live="polite" style={{ fontSize: '11px', color: failed ? 'var(--error)' : 'var(--text-muted)', marginTop: '4px' }}>
          {status}
        </div>
        {results.length > 0 && (
          <ul style={{ listStyle: 'none', margin: '4px 0 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {results.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => { onPick(item); setTerm(''); }} style={{ ...styles.secondary, width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '12px' }}>
                  {item.name}{item.code ? ` (${item.code})` : ''}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={onAddOther}
        disabled={disabled}
        className="btn-secondary"
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '9999px',
          border: '1px solid var(--border-glass)',
          background: 'var(--surface-soft)',
          color: 'var(--text-main)',
          fontSize: '12px',
          fontWeight: 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <Plus size={14} color="var(--accent)" />
        <span>Agregar otra compra</span>
      </button>
    </div>
  );
}

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
