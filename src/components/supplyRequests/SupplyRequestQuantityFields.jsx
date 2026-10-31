import React from 'react';
import { styles } from '../common/uiStyles';
import { normalizeRequestQuantity } from '../../services/supplyRequestsClient';

/**
 * Valida y normaliza las cantidades ingresadas para los ítems al aprobar.
 */
export function validateApproveQuantities(itemQuantities) {
  const errors = {};
  const list = [];
  const sentIds = new Set();
  for (const [idStr, raw] of Object.entries(itemQuantities || {})) {
    const text = String(raw ?? '').trim();
    if (text === '') continue;
    const normalized = normalizeRequestQuantity(text);
    if (!normalized) {
      errors[idStr] = 'Cantidad inválida. Ingresa un número positivo (hasta 3 decimales).';
    } else {
      list.push({ id: Number(idStr), quantity: normalized });
      sentIds.add(Number(idStr));
    }
  }
  return { valid: Object.keys(errors).length === 0, errors, list, sentIds };
}

/**
 * Campos para fijar cantidades por definir al aprobar un pedido (Brief 28p_fix2).
 * Muestra el error del motor con role="alert" encima de los campos y marca
 * con aria-invalid los campos cuya cantidad se envió.
 */
export default function SupplyRequestQuantityFields({
  items,
  values,
  errors,
  submittedIds,
  serverError,
  onChange
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 0' }}>
      {serverError && (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'var(--error-soft)',
            border: '1px solid var(--border-error)',
            color: 'var(--error)',
            fontSize: '12px'
          }}
        >
          {serverError}
        </div>
      )}

      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
        Fijar cantidades por definir (opcional):
      </span>

      {items.map((it) => {
        const localErr = errors[it.id];
        const isInvalid = Boolean(localErr || (serverError && submittedIds?.has(it.id)));

        return (
          <div key={it.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <label htmlFor={`approve-qty-${it.id}`} style={{ fontSize: '12px', color: 'var(--text-main)', flex: 1 }}>
                {it.name || it.free_text_name} ({it.unit || 'unidad'})
              </label>
              <input
                id={`approve-qty-${it.id}`}
                type="text"
                inputMode="decimal"
                placeholder="Por definir"
                value={values[it.id] || ''}
                aria-invalid={isInvalid}
                onChange={(e) => onChange(it.id, e.target.value)}
                style={{
                  ...styles.input,
                  width: '100px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  borderColor: isInvalid ? 'var(--border-error)' : undefined
                }}
              />
            </div>
            {localErr && (
              <span style={{ fontSize: '11px', color: 'var(--error)', textAlign: 'right' }}>
                {localErr}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
