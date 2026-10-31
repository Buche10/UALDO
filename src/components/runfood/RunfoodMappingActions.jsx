import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';

/**
 * Botones de acción y confirmación en dos pasos para mapeos de RunFood (Brief 24p-fix).
 */
export default function RunfoodMappingActions({
  mapping,
  status,
  isConfirmingIgnore,
  onStartIgnore,
  onCancelIgnore,
  onConfirmIgnore,
  onAcceptSuggestion,
  onEditMapping,
  onReopenMapping,
  disabled
}) {
  if (isConfirmingIgnore) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: 8,
          borderRadius: 8,
          background: 'var(--warning-soft)',
          border: '1px solid var(--border-warning)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--warning)' }}>
          <AlertTriangle size={14} />
          <span>No se descontará del inventario. ¿Confirmar que deseas ignorarlo?</span>
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancelIgnore}
            style={{
              padding: '4px 10px',
              borderRadius: 9999,
              border: '1px solid var(--border-glass)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: 11,
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmIgnore}
            style={{
              padding: '4px 12px',
              borderRadius: 9999,
              border: 'none',
              background: 'var(--warning)',
              color: 'var(--ualdo-negro)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Sí, ignorar
          </button>
        </div>
      </div>
    );
  }

  const hasSuggestion = Boolean(mapping.suggested_inventory_item);

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
      {status === 'pending' && hasSuggestion && (
        <button
          type="button"
          onClick={() => onAcceptSuggestion(mapping.id)}
          disabled={disabled}
          style={{
            padding: '6px 12px',
            borderRadius: 9999,
            border: 'none',
            background: 'var(--primary)',
            color: 'var(--on-primary)',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer'
          }}
        >
          <Check size={14} />
          <span>Aceptar</span>
        </button>
      )}

      {status === 'pending' && (
        <>
          <button
            type="button"
            onClick={() => onEditMapping(mapping)}
            disabled={disabled}
            style={{
              padding: '6px 12px',
              borderRadius: 9999,
              border: '1px solid var(--border-glass)',
              background: 'var(--chip-bg)',
              color: 'var(--text-main)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Elegir otro insumo
          </button>
          <button
            type="button"
            onClick={() => onStartIgnore(mapping.id)}
            disabled={disabled}
            style={{
              padding: '6px 12px',
              borderRadius: 9999,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Ignorar
          </button>
        </>
      )}

      {(status === 'confirmed' || status === 'ignored') && (
        <>
          <button
            type="button"
            onClick={() => onEditMapping(mapping)}
            disabled={disabled}
            style={{
              padding: '6px 12px',
              borderRadius: 9999,
              border: '1px solid var(--border-glass)',
              background: 'var(--chip-bg)',
              color: 'var(--text-main)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Cambiar
          </button>
          <button
            type="button"
            onClick={() => onReopenMapping(mapping.id)}
            disabled={disabled}
            style={{
              padding: '6px 12px',
              borderRadius: 9999,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Reabrir
          </button>
        </>
      )}
    </div>
  );
}
