import React, { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { useItemSearch } from '../../../hooks/usePurchasesData';
import { styles } from './purchaseUi';

function ItemSearch({ onPick, disabled }) {
  const [term, setTerm] = useState('');
  const { results, searching } = useItemSearch(term);

  return (
    <div>
      <label htmlFor="purchase-item-search" style={styles.label}>Agregar insumo</label>
      <div style={{ position: 'relative' }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input id="purchase-item-search" type="text" placeholder="Busca por nombre o código" value={term} disabled={disabled} onChange={(e) => setTerm(e.target.value)} style={{ ...styles.input, paddingLeft: '36px' }} />
      </div>
      <div aria-live="polite" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
        {searching ? 'Buscando...' : null}
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
  );
}

function LineRow({ line, errors, onChange, onRemove, disabled }) {
  const base = `purchase-${line.item.id}`;
  return (
    <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{line.item.name || `Insumo ${line.item.id}`}</strong>
        <button type="button" aria-label={`Quitar ${line.item.name || line.item.id}`} onClick={() => onRemove(line.key)} disabled={disabled} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '4px' }}>
          <Trash2 size={16} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label htmlFor={`${base}-qty`} style={styles.label}>Cantidad ({line.item.unit || 'unidad'})</label>
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

/**
 * Líneas de una compra: buscar y agregar insumos, y escribir cantidad, total
 * pagado y nota. No suma montos: el total lo calcula el motor al guardar.
 */
export default function PurchaseLinesEditor({ lines, lineErrors, onAddItem, onChange, onRemove, disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <ItemSearch onPick={onAddItem} disabled={disabled} />
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
