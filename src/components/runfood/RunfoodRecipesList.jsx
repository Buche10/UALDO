import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, AlertTriangle, AlertCircle, CheckCircle2, Sliders, X } from 'lucide-react';
import { useRunfoodRecipes } from '../../hooks/useRunfoodRecipes';
import { formatQuantity } from '../../services/quantityFormat';

/**
 * Listado paginado de recetas de RunFood con visor de ingredientes y estado (Brief 24p).
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

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const { items, loading, error, hasMore, loadMore, reload } = recipes;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Filtros de estado en pastillas */}
      <div
        role="group"
        aria-label="Filtro por estado de receta"
        style={{
          display: 'flex',
          gap: '6px',
          background: 'var(--chip-bg)',
          padding: '4px',
          borderRadius: '14px',
          border: '1px solid var(--border-glass)',
          overflowX: 'auto'
        }}
      >
        {[
          { id: '', label: 'Todas' },
          { id: 'completa', label: 'Completas' },
          { id: 'incompleta', label: 'Incompletas' },
          { id: 'con_opciones', label: 'Con opciones' }
        ].map((tab) => {
          const active = estado === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={active}
              onClick={() => setEstado(tab.id)}
              style={{
                flex: 1,
                minWidth: 'max-content',
                padding: '6px 10px',
                borderRadius: '10px',
                border: 'none',
                background: active ? 'var(--primary)' : 'transparent',
                color: active ? 'var(--on-primary)' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Buscador de recetas */}
      <div style={{ position: 'relative' }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
        <input
          type="text"
          placeholder="Buscar receta o plato..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px 8px 34px',
            borderRadius: '10px',
            border: '1px solid var(--border-glass)',
            background: 'var(--chip-bg)',
            color: 'var(--text-main)',
            fontSize: '13px'
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Limpiar búsqueda"
            style={{ position: 'absolute', right: '10px', top: '8px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--error)' }}>{error}</p>
          <button type="button" onClick={reload} style={{ alignSelf: 'flex-start', padding: '6px 12px', borderRadius: '9999px', border: '1px solid var(--error)', background: 'transparent', color: 'var(--error)', fontSize: '12px', cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
      )}

      {/* Carga inicial */}
      {loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando recetas...
        </div>
      )}

      {/* Vacío */}
      {!loading && !error && items.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
          No se encontraron recetas con los filtros seleccionados.
        </div>
      )}

      {/* Lista de recetas */}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((r) => {
            const isExpanded = expandedId === r.id;
            const lines = r.lineas || [];

            let badge = null;
            if (r.estado === 'completa') {
              badge = (
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} />
                  Completa
                </span>
              );
            } else if (r.estado === 'incompleta') {
              badge = (
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} />
                  Incompleta
                </span>
              );
            } else {
              badge = (
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Sliders size={12} />
                  Con opciones
                </span>
              );
            }

            return (
              <div
                key={r.id}
                className="glass-card"
                style={{
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                {/* Cabecera del acordeón */}
                <button
                  type="button"
                  onClick={() => toggleExpand(r.id)}
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
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {r.descripcion}
                      </span>
                      {r.codigo && (
                        <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                          ({r.codigo})
                        </span>
                      )}
                    </div>

                    {r.articulo_final?.descripcion && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Plato: {r.articulo_final.descripcion}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {badge}
                    {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                  </div>
                </button>

                {/* Contenido desplegado con las líneas de ingredientes */}
                {isExpanded && (
                  <div style={{ padding: '0 14px 14px 14px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-glass)' }}>
                    {/* Aviso de opciones */}
                    {r.tiene_opciones && (
                      <div
                        role="note"
                        style={{
                          marginTop: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: 'var(--warning-soft)',
                          border: '1px solid var(--border-warning)',
                          color: 'var(--warning)',
                          fontSize: '11px',
                          fontWeight: 500
                        }}
                      >
                        <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                        <span>Tiene opciones a elegir: solo se descuenta la parte fija.</span>
                      </div>
                    )}

                    {/* Tabla o listado de líneas */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: r.tiene_opciones ? '0' : '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Ingredientes requeridos ({lines.length})
                      </span>

                      {lines.map((l, idx) => {
                        const mappedItem = l.mapeo?.insumo;
                        const isConfirmed = l.mapeo?.status === 'confirmed';
                        const isIgnored = l.mapeo?.status === 'ignored';

                        return (
                          <div
                            key={l.articulo_runfood_id ?? idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              fontSize: '12px',
                              gap: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {l.descripcion_runfood}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Cant: {formatQuantity(l.cantidad)}
                              </span>
                            </div>

                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              {isConfirmed && mappedItem ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                                    {mappedItem.name}
                                  </span>
                                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                    x{l.mapeo.factor} {mappedItem.unit}
                                  </span>
                                </div>
                              ) : isIgnored ? (
                                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                                  Ignorado
                                </span>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ color: 'var(--warning)', fontWeight: 600, fontSize: '11px' }}>
                                    Sin asociar
                                  </span>
                                  {onResolveMapping && (
                                    <button
                                      type="button"
                                      onClick={() => onResolveMapping(l)}
                                      style={{ padding: '2px 8px', borderRadius: '9999px', border: '1px solid var(--border-warning)', background: 'transparent', color: 'var(--warning)', fontSize: '10px', cursor: 'pointer' }}
                                    >
                                      Asociar
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Cargar más recetas */}
          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loading}
              style={{
                marginTop: '6px',
                padding: '10px 16px',
                borderRadius: '9999px',
                border: '1px solid var(--border-glass)',
                background: 'var(--chip-bg)',
                color: 'var(--text-main)',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: loading ? 'default' : 'pointer'
              }}
            >
              <ChevronDown size={14} />
              <span>{loading ? 'Cargando más...' : 'Cargar más recetas'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
