import React, { useState } from 'react';
import { Plus, Search, Trash2, Utensils } from 'lucide-react';
import { useRunfoodDishSearch } from '../../hooks/useRunfoodDishSearch';
import { styles } from '../common/uiStyles';

const HELP_TEXT = 'Si el cliente aún no eligió, deja la reserva sin platos.';

/**
 * Platos opcionales de una reserva: buscador de RunFood y cantidad (Brief 39p).
 */
export default function ReservationDishes({ items = [], onChange, disabled = false, fieldErrors = {} }) {
  const [term, setTerm] = useState('');
  const { results, searching, failed } = useRunfoodDishSearch(term);

  const addDish = (dish) => {
    const existing = items.find((row) => Number(row.runfood_article_id) === Number(dish.runfood_article_id));
    if (existing) {
      onChange(items.map((row) => (
        Number(row.runfood_article_id) === Number(dish.runfood_article_id)
          ? { ...row, quantity: Math.min(500, Number(row.quantity) + 1) }
          : row
      )));
    } else {
      onChange([...items, { ...dish, quantity: 1 }]);
    }
    setTerm('');
  };

  const changeQuantity = (id, value) => {
    onChange(items.map((row) => (Number(row.runfood_article_id) === Number(id) ? { ...row, quantity: value } : row)));
  };

  const removeDish = (id) => {
    onChange(items.filter((row) => Number(row.runfood_article_id) !== Number(id)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Utensils size={15} color="var(--accent)" aria-hidden="true" />
        <span>Agregar platos (opcional)</span>
      </h4>
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{HELP_TEXT}</p>

      <div style={{ position: 'relative' }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} aria-hidden="true" />
        <input
          type="text"
          aria-label="Buscar plato en RunFood"
          placeholder="Escribe al menos 2 letras..."
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          disabled={disabled}
          style={{ ...styles.input, paddingLeft: '34px' }}
        />
      </div>

      {searching && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Buscando platos...</span>}
      {failed && <span style={{ fontSize: '11px', color: 'var(--error)' }}>No se pudo buscar en RunFood.</span>}

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '4px', maxHeight: '170px', overflowY: 'auto' }}>
          {results.map((dish) => (
            <button
              key={dish.runfood_article_id}
              type="button"
              onClick={() => addDish(dish)}
              disabled={disabled}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 10px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '12px', cursor: 'pointer', textAlign: 'left' }}
            >
              <span>{dish.name}</span>
              <Plus size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ ...styles.card, fontSize: '12px', color: 'var(--text-muted)' }}>
          Sin platos: la reserva solo ocupa la agenda y no compromete stock.
        </div>
      ) : (
        items.map((item, index) => (
          <div key={item.runfood_article_id} style={{ ...styles.card, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{item.name || `Plato ${item.runfood_article_id}`}</span>
            <label htmlFor={`reservation-dish-${item.runfood_article_id}`} style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cantidad</label>
            <input
              id={`reservation-dish-${item.runfood_article_id}`}
              type="number"
              min="1"
              max="500"
              step="1"
              value={item.quantity}
              onChange={(event) => changeQuantity(item.runfood_article_id, event.target.value)}
              disabled={disabled}
              style={{ ...styles.input, width: '72px', padding: '6px 8px', fontSize: '12px' }}
            />
            <button type="button" onClick={() => removeDish(item.runfood_article_id)} disabled={disabled} aria-label={`Quitar ${item.name}`} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '4px' }}>
              <Trash2 size={15} aria-hidden="true" />
            </button>
            {fieldErrors[`items.${index}.quantity`] && (
              <span style={{ fontSize: '10px', color: 'var(--error)' }}>{fieldErrors[`items.${index}.quantity`][0]}</span>
            )}
          </div>
        ))
      )}
    </div>
  );
}
