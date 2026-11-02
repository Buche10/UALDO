import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { useItemSearch } from '../../../hooks/usePurchasesData';
import { styles } from './purchaseUi';

/**
 * Buscador de insumos compartido por el alta de compras y la revisión de
 * facturas (Briefs 20p y 34ap).
 */
export default function ItemSearch({
  onPick,
  onAddOther,
  disabled,
  inputId = 'purchase-item-search',
  label = 'Agregar insumo',
  addOtherLabel = 'Agregar otra compra',
}) {
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
        <label htmlFor={inputId} style={styles.label}>{label}</label>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input id={inputId} type="text" placeholder="Busca por nombre o código" value={term} disabled={disabled} onChange={(e) => setTerm(e.target.value)} style={{ ...styles.input, paddingLeft: '36px' }} />
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

      {onAddOther && (
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
          <span>{addOtherLabel}</span>
        </button>
      )}
    </div>
  );
}
