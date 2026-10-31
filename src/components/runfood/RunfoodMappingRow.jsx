import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import RunfoodMappingActions from './RunfoodMappingActions';

/**
 * Fila individual para un ingrediente de RunFood y su estado de mapeo (Brief 24p-fix).
 */
export default function RunfoodMappingRow({
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
  const art = mapping.runfood_article || {};
  const suggested = mapping.suggested_inventory_item;
  const item = mapping.inventory_item;

  return (
    <div
      className="glass-card"
      style={{
        padding: 14,
        borderRadius: 12,
        border: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}
    >
      {/* Cabecera del artículo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
            {art.descripcion}
          </span>
          {art.codigo && (
            <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
              Código: {art.codigo}
            </span>
          )}
        </div>

        {mapping.recipes_count !== undefined && mapping.recipes_count > 0 && (
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 9999,
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              fontWeight: 600,
              flexShrink: 0
            }}
          >
            En {mapping.recipes_count} receta{mapping.recipes_count > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Sugerencia para pendientes */}
      {status === 'pending' && suggested && (
        <div
          style={{
            padding: '8px 10px',
            borderRadius: 8,
            background: 'var(--card-subtle-bg)',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} stroke="var(--accent)" />
            <span style={{ fontSize: 12, color: 'var(--text-main)', fontWeight: 600 }}>
              {suggested.name} ({suggested.unit || 'unidad'})
            </span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700 }}>
            {mapping.suggestion_score >= 90 ? 'Coincidencia alta' : 'Sugerencia'}
          </span>
        </div>
      )}

      {/* Insumo asignado para confirmados */}
      {status === 'confirmed' && item && (
        <div
          style={{
            padding: '8px 10px',
            borderRadius: 8,
            background: 'var(--success-soft)',
            border: '1px solid var(--border-success)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={14} stroke="var(--success)" />
            <span style={{ fontSize: 12, color: 'var(--text-main)', fontWeight: 600 }}>
              {item.name} ({item.unit})
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Factor: x{mapping.factor || '1'}
          </span>
        </div>
      )}

      {/* Estado ignorado */}
      {status === 'ignored' && (
        <div
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            background: 'var(--card-subtle-bg)',
            color: 'var(--text-muted)',
            fontSize: 11
          }}
        >
          Ignorado: no descuenta del inventario.
        </div>
      )}

      {/* Botones de acción */}
      <RunfoodMappingActions
        mapping={mapping}
        status={status}
        isConfirmingIgnore={isConfirmingIgnore}
        onStartIgnore={onStartIgnore}
        onCancelIgnore={onCancelIgnore}
        onConfirmIgnore={onConfirmIgnore}
        onAcceptSuggestion={onAcceptSuggestion}
        onEditMapping={onEditMapping}
        onReopenMapping={onReopenMapping}
        disabled={disabled}
      />
    </div>
  );
}
