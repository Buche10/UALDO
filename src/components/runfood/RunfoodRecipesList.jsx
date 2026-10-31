import React, { useState } from 'react';
import { useRunfoodRecipes } from '../../hooks/useRunfoodRecipes';
import RunfoodStatusTabs from './RunfoodStatusTabs';
import RunfoodSearchInput from './RunfoodSearchInput';
import RunfoodRecipeCard from './RunfoodRecipeCard';
import RunfoodLoadMoreButton from './RunfoodLoadMoreButton';

/**
 * Listado de recetas de RunFood con acordeón y filtros por estado (Brief 24p-fix).
 */
export default function RunfoodRecipesList({ onResolveMapping }) {
  const {
    estado,
    setEstado,
    search,
    setSearch,
    recipes
  } = useRunfoodRecipes();

  const [expandedId, setExpandedId] = useState(null);

  const tabs = [
    { key: '', label: 'Todas' },
    { key: 'completa', label: 'Completas' },
    { key: 'incompleta', label: 'Incompletas' },
    { key: 'con_opciones', label: 'Con opciones' }
  ];

  const handleToggle = (recipeId) => {
    setExpandedId((prev) => (prev === recipeId ? null : recipeId));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Filtro por estado de receta */}
      <RunfoodStatusTabs
        tabs={tabs}
        activeKey={estado}
        onSelect={setEstado}
        ariaLabel="Filtro por estado de receta"
      />

      {/* Buscador de recetas */}
      <RunfoodSearchInput
        value={search}
        onChange={setSearch}
        onClear={() => setSearch('')}
        placeholder="Buscar receta por nombre o código..."
        ariaLabel="Buscar recetas"
      />

      {/* Listado de recetas */}
      {recipes.loading && recipes.items.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
          Cargando recetas...
        </div>
      ) : recipes.error ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 18, color: 'var(--error)', fontSize: 13 }}>
          {recipes.error}
        </div>
      ) : recipes.items.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
          No se encontraron recetas con los filtros aplicados.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recipes.items.map((recipe) => (
            <RunfoodRecipeCard
              key={recipe.id}
              recipe={recipe}
              isExpanded={expandedId === recipe.id}
              onToggle={() => handleToggle(recipe.id)}
              onResolveMapping={onResolveMapping}
            />
          ))}

          <RunfoodLoadMoreButton
            hasMore={recipes.hasMore}
            loading={recipes.loading}
            onLoadMore={recipes.loadMore}
          />
        </div>
      )}
    </div>
  );
}
