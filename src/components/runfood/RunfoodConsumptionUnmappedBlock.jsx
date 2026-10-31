import React, { useState } from 'react';
import { AlertTriangle, BookOpen, ChevronDown, ChevronUp, Utensils } from 'lucide-react';
import RunfoodConsumptionUnmappedSection from './RunfoodConsumptionUnmappedSection';

/**
 * Bloque "No se desconto": agrupa articulos sin receta, recetas incompletas o con opciones (Brief 25p).
 */
export default function RunfoodConsumptionUnmappedBlock({
  sinReceta = [],
  incompletos = [],
  conOpciones = [],
  onNavigateToRecipes,
  onNavigateToMappings
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalCount = sinReceta.length + incompletos.length + conOpciones.length;

  if (totalCount === 0) return null;

  return (
    <div
      style={{
        borderRadius: 10,
        border: '1px solid var(--border-warning)',
        background: 'var(--warning-soft)',
        overflow: 'hidden'
      }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 8
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} stroke="var(--warning)" />
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
              No se descontó ({totalCount} {totalCount === 1 ? 'plato' : 'platos'})
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
              Platos vendidos sin receta completa o con opciones pendientes.
            </p>
          </div>
        </div>

        <span style={{ color: 'var(--text-muted)', display: 'flex' }}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {isExpanded && (
        <div
          style={{
            padding: '10px 12px 14px 12px',
            borderTop: '1px solid var(--border-warning)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          <RunfoodConsumptionUnmappedSection
            title="Sin receta"
            items={sinReceta}
            actionLabel="Crear receta"
            actionIcon={BookOpen}
            onAction={onNavigateToRecipes}
            qtyField="cantidad"
          />

          <RunfoodConsumptionUnmappedSection
            title="Recetas incompletas"
            items={incompletos}
            actionLabel="Mapear insumo"
            actionIcon={Utensils}
            onAction={onNavigateToMappings}
            qtyField="cantidad"
          />

          <RunfoodConsumptionUnmappedSection
            title="Con opciones"
            items={conOpciones}
            actionLabel="Ver receta"
            actionIcon={BookOpen}
            onAction={onNavigateToRecipes}
            qtyField="cantidad_vendida"
          />
        </div>
      )}
    </div>
  );
}
