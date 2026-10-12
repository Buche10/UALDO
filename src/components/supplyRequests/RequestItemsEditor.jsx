import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useItemSearch } from '../../hooks/useItemSearch';
import { styles } from '../common/uiStyles';

function CatalogSearch({ onPick, disabled }) {
  const [term, setTerm] = useState('');
  const { results, searching, failed } = useItemSearch(term);
  const query = term.trim();
  let status = null;
  if (searching) status = 'Buscando...';
  else if (failed) status = 'No se pudo buscar: revisa la conexión.';
  else if (query.length >= 2 && results.length === 0) status = `Sin resultados para "${query}". Puedes agregarlo en texto libre.`;

  return (
    <div>
      <label htmlFor="request-item-search" style={styles.label}>Buscar en el catálogo</label>
      <div style={{ position: 'relative' }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input id="request-item-search" type="text" placeholder="Nombre o código" value={term} disabled={disabled} onChange={(e) => setTerm(e.target.value)} style={{ ...styles.input, paddingLeft: '36px' }} />
      </div>
      <div aria-live="polite" style={{ fontSize: '11px', color: failed ? 'var(--error)' : 'var(--text-muted)', marginTop: '4px' }}>{status}</div>
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

function ItemRow({ line, errors, onChange, onRemove, disabled }) {
  const base = `request-${line.key.replace(':', '-')}`;
  const label = line.kind === 'catalog' ? line.name : (line.name || 'Insumo en texto libre');
  return (
    <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{label}</strong>
        <button type="button" aria-label={`Quitar ${label}`} onClick={() => onRemove(line.key)} disabled={disabled} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '4px' }}>
          <Trash2 size={16} />
        </button>
      </div>
      {line.kind === 'free' && (
        <div>
          <label htmlFor={`${base}-name`} style={styles.label}>Qué necesitas</label>
          <input id={`${base}-name`} type="text" maxLength={120} value={line.name} disabled={disabled} onChange={(e) => onChange(line.key, 'name', e.target.value)} style={styles.input} />
          <span aria-live="polite" style={styles.fieldError}>{errors?.name || null}</span>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label htmlFor={`${base}-qty`} style={styles.label}>Cantidad</label>
          <input id={`${base}-qty`} type="text" inputMode="decimal" value={line.quantity} disabled={disabled} onChange={(e) => onChange(line.key, 'quantity', e.target.value)} style={styles.input} />
          <span aria-live="polite" style={styles.fieldError}>{errors?.quantity || errors?.inventory_item_id || null}</span>
        </div>
        <div>
          <label htmlFor={`${base}-unit`} style={styles.label}>Unidad</label>
          <input id={`${base}-unit`} type="text" maxLength={20} value={line.unit} disabled={disabled || line.kind === 'catalog'} onChange={(e) => onChange(line.key, 'unit', e.target.value)} style={styles.input} />
          <span aria-live="polite" style={styles.fieldError}>{errors?.unit || null}</span>
        </div>
      </div>
      <div>
        <label htmlFor={`${base}-note`} style={styles.label}>Nota (opcional)</label>
        <input id={`${base}-note`} type="text" maxLength={200} value={line.note} disabled={disabled} onChange={(e) => onChange(line.key, 'note', e.target.value)} style={styles.input} />
        <span aria-live="polite" style={styles.fieldError}>{errors?.note || null}</span>
      </div>
    </div>
  );
}

/**
 * Líneas de un pedido: del catálogo o en texto libre (Brief 22p). Al agregar
 * una línea, el foco pasa a su primer campo.
 */
export default function RequestItemsEditor({ items, itemErrors, onAddCatalog, onAddFree, onChange, onRemove, disabled }) {
  const [focusKey, setFocusKey] = useState(null);

  useEffect(() => {
    if (!focusKey) return;
    const line = items.find((item) => item.key === focusKey);
    if (!line) return;
    const base = `request-${focusKey.replace(':', '-')}`;
    document.getElementById(line.kind === 'free' ? `${base}-name` : `${base}-qty`)?.focus();
    setFocusKey(null);
  }, [focusKey, items]);

  const addFree = () => setFocusKey(onAddFree());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <CatalogSearch onPick={(item) => { onAddCatalog(item); setFocusKey(`cat:${item.id}`); }} disabled={disabled} />
      <button type="button" onClick={addFree} disabled={disabled} style={{ ...styles.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}>
        <Plus size={14} />
        <span>Agregar en texto libre</span>
      </button>
      {items.length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Todavía no hay insumos en el pedido.</p>}
      {items.map((line) => (
        <ItemRow key={line.key} line={line} errors={itemErrors[line.key]} onChange={onChange} onRemove={onRemove} disabled={disabled} />
      ))}
    </div>
  );
}
