import React, { useState } from 'react';
import { Search, Check, X, AlertTriangle, Sparkles, ChevronDown } from 'lucide-react';
import { useRunfoodMappings } from '../../hooks/useRunfoodMappings';
import RunfoodMappingEditModal from './RunfoodMappingEditModal';

/**
 * Panel para la asociación de ingredientes de RunFood a insumos de Ualdo (Brief 24p).
 */
export default function RunfoodMappingsPanel() {
  const {
    status,
    setStatus,
    search,
    setSearch,
    counts,
    items,
    loading,
    error,
    hasMore,
    loadMore,
    reload,
    actionError,
    successBanner,
    submitting,
    submittingId,
    handleAcceptSuggestion,
    handleUpdateMapping,
    handleIgnoreMapping,
    handleReopenMapping
  } = useRunfoodMappings();

  const [editingMapping, setEditingMapping] = useState(null);
  const [confirmIgnoreId, setConfirmIgnoreId] = useState(null);

  const handleSaveModal = async (mappingId, payload) => {
    const res = await handleUpdateMapping(mappingId, payload);
    if (res.ok) {
      setEditingMapping(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Mensajes de éxito y error */}
      {successBanner && (
        <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--success-soft)', border: '1px solid var(--border-success)', color: 'var(--success)', fontSize: '12px', fontWeight: 500 }}>
          {successBanner}
        </div>
      )}

      {actionError && (
        <div role="alert" style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px', fontWeight: 500 }}>
          {actionError}
        </div>
      )}

      {/* Selector de pestañas por estado con contadores */}
      <div
        role="tablist"
        aria-label="Estado de mapeos"
        style={{
          display: 'flex',
          gap: '6px',
          background: 'var(--chip-bg)',
          padding: '4px',
          borderRadius: '14px',
          border: '1px solid var(--border-glass)'
        }}
      >
        {[
          { id: 'pending', label: 'Pendientes', count: counts.pending },
          { id: 'confirmed', label: 'Confirmados', count: counts.confirmed },
          { id: 'ignored', label: 'Ignorados', count: counts.ignored }
        ].map((tab) => {
          const active = status === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => { setStatus(tab.id); setConfirmIgnoreId(null); }}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '10px',
                border: 'none',
                background: active ? 'var(--primary)' : 'transparent',
                color: active ? 'var(--on-primary)' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  background: active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                  fontSize: '10px',
                  fontWeight: 700
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Buscador de ingredientes */}
      <div style={{ position: 'relative' }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
        <input
          type="text"
          placeholder="Buscar ingrediente de RunFood o insumo..."
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

      {/* Estado de error */}
      {error && (
        <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--error)' }}>{error}</p>
          <button type="button" onClick={reload} style={{ alignSelf: 'flex-start', padding: '6px 12px', borderRadius: '9999px', border: '1px solid var(--error)', background: 'transparent', color: 'var(--error)', fontSize: '12px', cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
      )}

      {/* Estado de carga inicial */}
      {loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando ingredientes...
        </div>
      )}

      {/* Estado vacío */}
      {!loading && !error && items.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
          No hay ingredientes en esta sección.
        </div>
      )}

      {/* Lista de ingredientes */}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((m) => {
            const article = m.runfood_article || {};
            const suggested = m.suggested_inventory_item;
            const confirmed = m.inventory_item;
            const isSubmittingThis = submitting && submittingId === m.id;
            const isConfirmingIgnore = confirmIgnoreId === m.id;

            let scoreBadge = null;
            if (suggested && m.suggestion_score !== undefined) {
              const score = Number(m.suggestion_score);
              const label = score >= 80 ? 'Coincidencia alta' : (score >= 60 ? 'Coincidencia media' : 'Coincidencia baja');
              const color = score >= 80 ? 'var(--success)' : (score >= 60 ? 'var(--accent)' : 'var(--warning)');
              scoreBadge = (
                <span style={{ fontSize: '10px', fontWeight: 600, color, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Sparkles size={10} />
                  {label} ({score}%)
                </span>
              );
            }

            return (
              <div
                key={m.id}
                className="glass-card"
                style={{
                  padding: '12px',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Información del artículo de RunFood */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {article.descripcion || 'Sin nombre'}
                      </span>
                      {article.codigo && (
                        <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                          ({article.codigo})
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      En {m.recipes_count ?? 0} {m.recipes_count === 1 ? 'receta' : 'recetas'}
                    </span>
                  </div>

                  {article.stockeable && (
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '9999px', background: 'rgba(98, 201, 200, 0.1)', color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>
                      Stockeable
                    </span>
                  )}
                </div>

                {/* Sugerencia o mapeo actual */}
                {status === 'pending' && suggested && (
                  <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sugerencia de Ualdo</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {suggested.name} ({suggested.unit})
                      </span>
                    </div>
                    {scoreBadge}
                  </div>
                )}

                {status === 'confirmed' && confirmed && (
                  <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid var(--border-success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Insumo asociado</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {confirmed.name} ({confirmed.unit})
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>
                      Factor: x{m.factor}
                    </span>
                  </div>
                )}

                {status === 'ignored' && (
                  <div style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-muted)', fontSize: '11px' }}>
                    Ignorado: no se descuenta del inventario.
                  </div>
                )}

                {/* Confirmación en dos pasos de Ignorar */}
                {isConfirmingIgnore ? (
                  <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--warning-soft)', border: '1px solid var(--border-warning)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--warning)' }}>
                      <AlertTriangle size={14} />
                      <span>No se descontará del inventario. ¿Confirmar que deseas ignorarlo?</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setConfirmIgnoreId(null)}
                        style={{ padding: '4px 10px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => { setConfirmIgnoreId(null); handleIgnoreMapping(m.id); }}
                        style={{ padding: '4px 12px', borderRadius: '9999px', border: 'none', background: 'var(--warning)', color: 'var(--ualdo-negro)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Sí, ignorar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Botones de acción regulares */
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '2px' }}>
                    {status === 'pending' && suggested && (
                      <button
                        type="button"
                        onClick={() => handleAcceptSuggestion(m.id)}
                        disabled={isSubmittingThis}
                        style={{ padding: '6px 12px', borderRadius: '9999px', border: 'none', background: 'var(--primary)', color: 'var(--on-primary)', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                      >
                        <Check size={14} />
                        <span>Aceptar</span>
                      </button>
                    )}

                    {status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingMapping(m)}
                          disabled={isSubmittingThis}
                          style={{ padding: '6px 12px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                        >
                          Elegir otro insumo
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmIgnoreId(m.id)}
                          disabled={isSubmittingThis}
                          style={{ padding: '6px 12px', borderRadius: '9999px', border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Ignorar
                        </button>
                      </>
                    )}

                    {(status === 'confirmed' || status === 'ignored') && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingMapping(m)}
                          disabled={isSubmittingThis}
                          style={{ padding: '6px 12px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                        >
                          Cambiar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReopenMapping(m.id)}
                          disabled={isSubmittingThis}
                          style={{ padding: '6px 12px', borderRadius: '9999px', border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Reabrir
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Botón Cargar más */}
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
              <span>{loading ? 'Cargando más...' : 'Cargar más ingredientes'}</span>
            </button>
          )}
        </div>
      )}

      {/* Modal para elegir otro insumo y factor */}
      <RunfoodMappingEditModal
        isOpen={Boolean(editingMapping)}
        mapping={editingMapping}
        onClose={() => setEditingMapping(null)}
        onSave={handleSaveModal}
        submitting={submitting}
        error={actionError}
      />
    </div>
  );
}
