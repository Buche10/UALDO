import React, { useState, useRef } from 'react';
import { ArrowLeft, Plus, ClipboardList, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useCounts } from '../../../hooks/useCounts';
import { INVENTORY_LOCATIONS } from '../../../services/inventoryLocations';
import CountSheet from './CountSheet';
import NewCountModal from './NewCountModal';

export default function CountsView({ isOwner, onBack }) {
  const [activeCountId, setActiveCountId] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const newCountBtnRef = useRef(null);

  const {
    counts,
    loading,
    error,
    hasMore,
    loadMore,
    reload,
    createCount,
    locationFilter,
    setLocationFilter,
    statusFilter,
    setStatusFilter,
  } = useCounts({ isOwner });

  if (activeCountId) {
    return (
      <CountSheet
        countId={activeCountId}
        onBack={() => {
          setActiveCountId(null);
          reload();
        }}
        onAppliedComplete={() => {
          reload();
        }}
      />
    );
  }

  const handleStartCount = async (location, notes) => {
    const res = await createCount(location, notes);
    if (res.ok && res.data?.id) {
      setActiveCountId(res.data.id);
    }
    return res;
  };

  const getStatusBadge = (status) => {
    if (status === 'draft') {
      return (
        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', background: 'var(--warning-soft)', color: 'var(--warning)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} />
          <span>Borrador</span>
        </span>
      );
    }
    if (status === 'applied') {
      return (
        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', background: 'var(--success-soft)', color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={12} />
          <span>Aplicado</span>
        </span>
      );
    }
    return (
      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', background: 'var(--surface-soft)', color: 'var(--text-muted)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <XCircle size={12} />
        <span>Cancelado</span>
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: '4px 0' }}
        >
          <ArrowLeft size={16} />
          <span>Volver al inventario</span>
        </button>

        <button
          ref={newCountBtnRef}
          type="button"
          className="btn-primary"
          onClick={() => setShowNewModal(true)}
          style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          <span>Nuevo Conteo</span>
        </button>
      </div>

      <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
        <h2 className="section-title" style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={18} color="var(--accent)" />
          <span>Conteos Físicos por Ubicación</span>
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Exclusivo de administración. Permite fijar el inventario real por bodega, cocina o salón.
        </p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <div>
            <label htmlFor="counts-location-filter" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
              Filtrar por ubicación
            </label>
            <select
              id="counts-location-filter"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)', fontSize: '12px' }}
            >
              <option value="">Todas las ubicaciones</option>
              {INVENTORY_LOCATIONS.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="counts-status-filter" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
              Filtrar por estado
            </label>
            <select
              id="counts-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)', fontSize: '12px' }}
            >
              <option value="">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="applied">Aplicado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px', border: '1px solid var(--border-error)' }}>
          {error}
        </div>
      )}

      {loading && counts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando lista de conteos...
        </div>
      ) : counts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
          No hay conteos registrados con los filtros seleccionados.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {counts.map((c) => (
            <button
              type="button"
              key={c.id}
              className="glass-card-interactive"
              onClick={() => setActiveCountId(c.id)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-glass)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
                font: 'inherit',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {c.location_label || c.location}
                  </span>
                  {getStatusBadge(c.status)}
                </div>
                {c.notes && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {c.notes}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '4px' }}>
                  {c.created_at ? new Date(c.created_at).toLocaleString('es-EC') : ''}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
                  Abrir conteo
                </span>
              </div>
            </button>
          ))}

          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loading}
              className="glass-card-interactive"
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--accent)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '6px' }}
            >
              {loading ? 'Cargando más...' : 'Cargar más conteos'}
            </button>
          )}
        </div>
      )}

      <NewCountModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={handleStartCount}
        triggerRef={newCountBtnRef}
      />
    </div>
  );
}
