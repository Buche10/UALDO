import React, { useState } from 'react';
import { ArrowLeft, ChefHat, ShieldCheck, Utensils, BookOpen } from 'lucide-react';
import { useRunfoodCoverage } from '../../hooks/useRunfoodCoverage';
import RunfoodCoverageCard from './RunfoodCoverageCard';
import RunfoodMappingsPanel from './RunfoodMappingsPanel';
import RunfoodRecipesList from './RunfoodRecipesList';

const SECTIONS = [
  { id: 'coverage', label: 'Cobertura', icon: ShieldCheck },
  { id: 'mappings', label: 'Ingredientes', icon: Utensils },
  { id: 'recipes', label: 'Recetas', icon: BookOpen }
];

/**
 * Pantalla principal de recetas y mapeo de RunFood para el dueño (Brief 24p-fix).
 */
export default function RunfoodRecipesView({ onBack }) {
  const [activeSection, setActiveSection] = useState('coverage');
  const [mappingsSearch, setMappingsSearch] = useState('');

  const {
    days,
    setDays,
    data: coverageData,
    loading: coverageLoading,
    error: coverageError,
    reload: reloadCoverage
  } = useRunfoodCoverage();

  const handleResolveMapping = (ingredientDescription) => {
    setMappingsSearch(ingredientDescription || '');
    setActiveSection('mappings');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Cabecera con botón de retroceso */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver a Inventario"
            style={{
              padding: 8,
              borderRadius: 9999,
              border: '1px solid var(--border-glass)',
              background: 'var(--chip-bg)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowLeft size={16} />
          </button>
        )}

        <div>
          <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ChefHat size={20} stroke="var(--accent)" />
            <span>Recetas de RunFood</span>
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            Mapeo de insumos, verificación de recetas y cobertura de ventas.
          </p>
        </div>
      </div>

      {/* Selector de sección tipo pastilla */}
      <div
        role="tablist"
        aria-label="Secciones de RunFood"
        style={{
          display: 'flex',
          gap: 6,
          background: 'var(--chip-bg)',
          padding: 4,
          borderRadius: 14,
          border: '1px solid var(--border-glass)'
        }}
      >
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const active = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveSection(sec.id)}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 10,
                border: 'none',
                background: active ? 'var(--primary)' : 'transparent',
                color: active ? 'var(--on-primary)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={14} />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido de la sección activa */}
      {activeSection === 'coverage' && (
        <RunfoodCoverageCard
          data={coverageData}
          loading={coverageLoading}
          error={coverageError}
          onRetry={reloadCoverage}
          days={days}
          onDaysChange={setDays}
        />
      )}

      {activeSection === 'mappings' && (
        <RunfoodMappingsPanel initialSearch={mappingsSearch} />
      )}

      {activeSection === 'recipes' && (
        <RunfoodRecipesList
          onResolveMapping={handleResolveMapping}
        />
      )}
    </div>
  );
}
