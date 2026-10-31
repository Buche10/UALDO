import React, { useState } from 'react';
import { useRunfoodMappings } from '../../hooks/useRunfoodMappings';
import RunfoodStatusTabs from './RunfoodStatusTabs';
import RunfoodSearchInput from './RunfoodSearchInput';
import RunfoodMappingRow from './RunfoodMappingRow';
import RunfoodLoadMoreButton from './RunfoodLoadMoreButton';
import RunfoodMappingEditModal from './RunfoodMappingEditModal';

/**
 * Panel de ingredientes de RunFood con pestañas de estado (Brief 24p-fix).
 */
export default function RunfoodMappingsPanel({ initialSearch = '' }) {
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
    actionError,
    fieldErrors,
    clearErrors,
    successBanner,
    submitting,
    submittingId,
    handleAcceptSuggestion,
    handleUpdateMapping,
    handleIgnoreMapping,
    handleReopenMapping
  } = useRunfoodMappings({ initialSearch });

  const [confirmIgnoreId, setConfirmIgnoreId] = useState(null);
  const [editingMapping, setEditingMapping] = useState(null);

  const tabs = [
    { key: 'pending', label: 'Pendientes', count: counts.pending },
    { key: 'confirmed', label: 'Confirmados', count: counts.confirmed },
    { key: 'ignored', label: 'Ignorados', count: counts.ignored }
  ];

  const handleSaveModal = async (mappingId, payload) => {
    const res = await handleUpdateMapping(mappingId, payload);
    if (res.ok) {
      setEditingMapping(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Banner de éxito */}
      {successBanner && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            background: 'var(--success-soft)',
            border: '1px solid var(--border-success)',
            color: 'var(--success)',
            fontSize: 12,
            fontWeight: 500
          }}
        >
          {successBanner}
        </div>
      )}

      {/* Banner de error general de acción fuera del modal */}
      {actionError && !editingMapping && (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            background: 'var(--error-soft)',
            border: '1px solid var(--border-error)',
            color: 'var(--error)',
            fontSize: 12
          }}
        >
          {actionError}
        </div>
      )}

      {/* Pestañas de estado con contadores */}
      <RunfoodStatusTabs
        tabs={tabs}
        activeKey={status}
        onSelect={(tabKey) => {
          setStatus(tabKey);
          setConfirmIgnoreId(null);
        }}
        ariaLabel="Estado de mapeos"
      />

      {/* Buscador */}
      <RunfoodSearchInput
        value={search}
        onChange={setSearch}
        onClear={() => setSearch('')}
        placeholder="Buscar ingrediente de RunFood o insumo..."
        ariaLabel="Buscar ingredientes"
      />

      {/* Lista de mapeos */}
      {loading && items.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
          Cargando ingredientes...
        </div>
      ) : error ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 18, color: 'var(--error)', fontSize: 13 }}>
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
          No hay ingredientes en esta sección.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((m) => (
            <RunfoodMappingRow
              key={m.id}
              mapping={m}
              status={status}
              isConfirmingIgnore={confirmIgnoreId === m.id}
              onStartIgnore={(id) => setConfirmIgnoreId(id)}
              onCancelIgnore={() => setConfirmIgnoreId(null)}
              onConfirmIgnore={() => {
                setConfirmIgnoreId(null);
                handleIgnoreMapping(m.id);
              }}
              onAcceptSuggestion={handleAcceptSuggestion}
              onEditMapping={(mapping) => {
                clearErrors();
                setEditingMapping(mapping);
              }}
              onReopenMapping={handleReopenMapping}
              disabled={submitting && submittingId === m.id}
            />
          ))}

          <RunfoodLoadMoreButton
            hasMore={hasMore}
            loading={loading}
            onLoadMore={loadMore}
          />
        </div>
      )}

      {/* Modal para asociar / cambiar insumo */}
      <RunfoodMappingEditModal
        isOpen={Boolean(editingMapping)}
        mapping={editingMapping}
        onClose={() => setEditingMapping(null)}
        onSave={handleSaveModal}
        submitting={submitting && submittingId === editingMapping?.id}
        error={actionError}
        fieldErrors={fieldErrors}
        onClearErrors={clearErrors}
      />
    </div>
  );
}
