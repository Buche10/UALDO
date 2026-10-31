import React from 'react';
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, SlidersVertical, Info } from 'lucide-react';
import RunfoodRecipeLine from './RunfoodRecipeLine';

/**
 * Tarjeta de receta de RunFood con acordeón de desglose de líneas (Brief 24p-fix).
 */
export default function RunfoodRecipeCard({
  recipe,
  isExpanded,
  onToggle,
  onResolveMapping
}) {
  const isCompleta = recipe.estado === 'completa';
  const isConOpciones = recipe.estado === 'con_opciones';
  const lineas = recipe.lineas || [];

  return (
    <div
      className="glass-card"
      style={{
        borderRadius: 12,
        border: '1px solid var(--border-glass)',
        overflow: 'hidden'
      }}
    >
      {/* Botón cabecera del acordeón */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        style={{
          width: '100%',
          padding: '12px 14px',
          border: 'none',
          background: 'transparent',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
              {recipe.descripcion}
            </span>
            {recipe.codigo && (
              <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                ({recipe.codigo})
              </span>
            )}
          </div>
          {(recipe.articulo_final || recipe.plato) && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Plato: {(recipe.articulo_final || recipe.plato).descripcion}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isCompleta && (
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={12} />
              Completa
            </span>
          )}
          {isConOpciones && (
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <SlidersVertical size={12} />
              Con opciones
            </span>
          )}
          {!isCompleta && !isConOpciones && (
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <AlertCircle size={12} />
              Incompleta
            </span>
          )}

          {isExpanded ? (
            <ChevronUp size={16} stroke="var(--text-muted)" />
          ) : (
            <ChevronDown size={16} stroke="var(--text-muted)" />
          )}
        </div>
      </button>

      {/* Contenido desplegable */}
      {isExpanded && (
        <div
          style={{
            padding: '0 14px 14px 14px',
            borderTop: '1px solid var(--border-glass)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginTop: 4
          }}
        >
          {recipe.tiene_opciones && (
            <div
              role="note"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 8,
                background: 'var(--accent-soft)',
                border: '1px solid var(--border-glass)',
                color: 'var(--accent)',
                fontSize: 11,
                fontWeight: 500,
                marginTop: 8
              }}
            >
              <Info size={14} />
              <span>Tiene opciones a elegir: solo se descuenta la parte fija.</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: recipe.tiene_opciones ? 0 : 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
              Ingredientes ({lineas.length})
            </span>

            {lineas.map((linea, idx) => (
              <RunfoodRecipeLine
                key={linea.id ?? `${linea.linea}-${idx}`}
                line={linea}
                onResolveMapping={onResolveMapping}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
