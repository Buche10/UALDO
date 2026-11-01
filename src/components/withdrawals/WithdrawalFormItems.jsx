import React from 'react';
import { Plus } from 'lucide-react';
import WithdrawalItemRow from './WithdrawalItemRow';

export default function WithdrawalFormItems({
  items,
  onAddItem,
  onRemoveItem,
  onItemChange,
  lineErrors,
  disabled,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
        Insumos a retirar ({items.length} de 15)
      </label>

      {items.map((it, idx) => (
        <WithdrawalItemRow
          key={it.tempId}
          item={it}
          index={idx}
          onChange={onItemChange}
          onRemove={onRemoveItem}
          canRemove={items.length > 1}
          lineError={lineErrors[it.item_id]}
          disabled={disabled}
        />
      ))}

      {items.length < 15 && !disabled && (
        <button
          type="button"
          onClick={onAddItem}
          className="glass-card-interactive"
          style={{
            alignSelf: 'flex-start',
            padding: '6px 14px',
            borderRadius: '9999px',
            border: '1px solid var(--border-glass)',
            background: 'var(--surface-soft)',
            color: 'var(--accent)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '4px',
          }}
        >
          <Plus size={14} />
          <span>Añadir otro insumo</span>
        </button>
      )}
    </div>
  );
}
