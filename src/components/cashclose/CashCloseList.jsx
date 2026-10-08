import React, { useState, useMemo } from 'react';
import { Calendar, RefreshCw, AlertTriangle, Plus, ChevronRight, Sliders } from 'lucide-react';
import { formatUsd } from '../../services/money';

export default function CashCloseList({
  closes = [],
  loading = false,
  error = null,
  onSelectFecha,
  onOpenManual,
  onOpenConfig,
  onRefresh
}) {
  const [onlyInReview, setOnlyInReview] = useState(false);

  const displayCloses = useMemo(() => {
    let list = Array.isArray(closes) ? [...closes] : [];
    if (onlyInReview) {
      list = list.filter(c => c.status === 'revision');
    }
    // Ordenar: dias en revision primero, luego por fecha descendente
    return list.sort((a, b) => {
      const aRev = a.status === 'revision' ? 1 : 0;
      const bRev = b.status === 'revision' ? 1 : 0;
      if (aRev !== bRev) return bRev - aRev;
      return String(b.fecha || '').localeCompare(String(a.fecha || ''));
    });
  }, [closes, onlyInReview]);

  const getStatusLabel = (item) => {
    if (item.status === 'revision') return 'En revisión';
    if (item.status === 'cerrado') {
      return item.auto_cerrado ? 'Cerrado solo' : 'Cerrado';
    }
    if (item.status === 'borrador') return 'Borrador';
    return item.status || 'Desconocido';
  };

  const getStatusStyle = (status) => {
    if (status === 'revision') {
      return {
        background: 'var(--warning-soft)',
        color: 'var(--warning)',
        border: '1px solid var(--border-warning)'
      };
    }
    if (status === 'cerrado') {
      return {
        background: 'var(--success-soft)',
        color: 'var(--success)',
        border: '1px solid var(--border-success)'
      };
    }
    return {
      background: 'var(--surface-soft)',
      color: 'var(--text-muted)',
      border: '1px solid var(--border-glass)'
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Cierres de Caja</h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
            Supervisión diaria del Libro y arqueos del motor
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onOpenConfig && (
            <button
              type="button"
              onClick={onOpenConfig}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}
            >
              <Sliders size={14} />
              <span>Configurar caja</span>
            </button>
          )}
          {onOpenManual && (
            <button
              type="button"
              onClick={onOpenManual}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}
            >
              <Plus size={14} />
              <span>Cargar a mano</span>
            </button>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Actualizar cierres"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setOnlyInReview(!onlyInReview)}
          style={{ padding: '6px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: onlyInReview ? '1px solid var(--border-warning)' : '1px solid var(--border-glass)', background: onlyInReview ? 'var(--warning-soft)' : 'var(--chip-bg)', color: onlyInReview ? 'var(--warning)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <AlertTriangle size={13} />
          <span>Solo en revisión</span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'var(--error-soft)',
            border: '1px solid var(--border-error)',
            color: 'var(--error)',
            fontSize: '13px'
          }}
        >
          {error}
        </div>
      )}

      {loading && displayCloses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando cierres de caja...
        </div>
      ) : displayCloses.length === 0 ? (
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          No hay cierres para mostrar.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {displayCloses.map(cierre => {
            const isReview = cierre.status === 'revision';
            const reasonCount = Array.isArray(cierre.discrepancias) ? cierre.discrepancias.length : 0;

            return (
              <div
                key={cierre.fecha || cierre.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectFecha(cierre.fecha)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectFecha(cierre.fecha);
                }}
                className="glass-card glass-card-interactive"
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: isReview ? '1px solid var(--border-warning)' : '1px solid var(--border-glass)',
                  background: isReview ? 'var(--warning-soft)' : 'var(--bg-card)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '14px' }}>
                      <Calendar size={14} color="var(--accent)" />
                      <span>{cierre.fecha}</span>
                    </div>

                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        ...getStatusStyle(cierre.status)
                      }}
                    >
                      {getStatusLabel(cierre)}
                    </span>

                    {isReview && reasonCount > 0 && (
                      <span
                        style={{
                          padding: '2px 7px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: 'var(--warning)',
                          color: 'var(--bg-dark)'
                        }}
                      >
                        {reasonCount} {reasonCount === 1 ? 'motivo' : 'motivos'}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <div>
                      <span>Ventas: </span>
                      <strong style={{ color: 'var(--text-main)' }}>{formatUsd(cierre.ventas_del_dia)}</strong>
                    </div>
                    <div>
                      <span>Dif. efectivo: </span>
                      <strong style={{ color: 'var(--text-main)' }}>{formatUsd(cierre.diferencia_efectivo)}</strong>
                    </div>
                  </div>
                </div>

                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
