import React from 'react';
import { Plus } from 'lucide-react';
import { formatDate, formatPct, runLocation } from './productionFormat';

function StatusBadge({ status }) {
  const voided = status === 'voided';
  return (
    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600, background: voided ? 'var(--surface-soft)' : 'var(--success-soft)', color: voided ? 'var(--text-muted)' : 'var(--success)' }}>
      {voided ? 'Anulada' : 'Registrada'}
    </span>
  );
}

/**
 * Lista de producciones del negocio, la más reciente primero (Brief 21p).
 */
export default function ProductionRunList({ runs, loading, error, hasMore, onLoadMore, onReload, onOpen, onNew }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <button type="button" onClick={onNew} className="btn-primary" style={{ alignSelf: 'flex-end', padding: '8px 14px', fontSize: '12px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Plus size={16} />
        <span>Nuevo porcionado</span>
      </button>

      <div aria-live="polite">
        {error && (
          <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <span>{error}</span>
          <button type="button" onClick={onReload} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '9999px' }}>Reintentar</button>
          </div>
        )}
      </div>

      {loading && runs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>Cargando producciones...</div>
      ) : runs.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>Todavía no hay producciones registradas.</div>
      ) : (
        runs.map((run) => (
          <button
            key={run.id}
            type="button"
            onClick={() => onOpen(run)}
            className="glass-card-interactive"
            style={{ textAlign: 'left', padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}
          >
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>{run.template_name}</span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                {runLocation(run)}, {formatDate(run.created_at)}
              </span>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <StatusBadge status={run.status} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Rendimiento {formatPct(run.real_yield_pct)}</span>
            </span>
          </button>
        ))
      )}

      {hasMore && (
        <button type="button" onClick={onLoadMore} disabled={loading} style={{ padding: '8px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--accent)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          {loading ? 'Cargando más...' : 'Cargar más'}
        </button>
      )}
    </div>
  );
}
