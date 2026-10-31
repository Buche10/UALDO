import React, { useState } from 'react';
import { ArrowLeft, ChefHat, ShieldCheck, Utensils, BookOpen, Flame } from 'lucide-react';
import { useRunfoodCoverage } from '../../hooks/useRunfoodCoverage';
import RunfoodCoverageCard from './RunfoodCoverageCard';
import RunfoodMappingsPanel from './RunfoodMappingsPanel';
import RunfoodRecipesList from './RunfoodRecipesList';
import RunfoodConsumptionView from './RunfoodConsumptionView';

const SECTIONS = [
  { id: 'coverage', label: 'Cobertura', icon: ShieldCheck },
  { id: 'mappings', label: 'Ingredientes', icon: Utensils },
  { id: 'recipes', label: 'Recetas', icon: BookOpen },
  { id: 'consumption', label: 'Consumo', icon: Flame }
];

/**
 * Pantalla principal de recetas, mapeo y consumo de RunFood para el dueño (Brief 24p/25p).
 */
export default function RunfoodRecipesView({ onBack }) {
  const [activeSection, setActiveSection] = useState('coverage');
  const [mappingsSearch, setMappingsSearch] = useState('');
  const [recipesSearch, setRecipesSearch] = useState('');

  const {
    days,
    setDays,
    data: coverageData,
    loading: coverageLoading,
    error: coverageError,
    reload: reloadCoverage
  } = useRunfoodCoverage();

  const handleNavigateToMappings = (ingredientDescription) => {
    setMappingsSearch(ingredientDescription || '');
    setActiveSection('mappings');
  };

  const handleNavigateToRecipes = (dishDescription) => {
    setRecipesSearch(dishDescription || '');
    setActiveSection('recipes');
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
            Mapeo de insumos, verificación de recetas, cobertura y consumo diario.
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
          border: '1px solid var(--border-glass)',
          overflowX: 'auto'
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
              onClick={() => {
                setActiveSection(sec.id);
                setMappingsSearch('');
              }}
              style={{
                flex: 1,
                minWidth: 80,
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
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
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
        <RunfoodMappingsPanel key={mappingsSearch} initialSearch={mappingsSearch} />
      )}

      {activeSection === 'recipes' && (
        <RunfoodRecipesList
          initialSearch={recipesSearch}
          onResolveMapping={handleNavigateToMappings}
        />
      )}

      {activeSection === 'consumption' && (
        <RunfoodConsumptionView
          onNavigateToRecipes={handleNavigateToRecipes}
          onNavigateToMappings={handleNavigateToMappings}
        />
      )}
    </div>
  );
}
