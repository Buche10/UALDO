import React from 'react';
import { ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatUsd } from '../../services/money';

/**
 * Tarjeta de cobertura de ventas por recetas (Brief 24p).
 * Muestra el porcentaje de lo vendido con receta completa, venta directa o sin cubrir,
 * y los 10 platos sin receta o incompletos con mayores ventas.
 */
export default function RunfoodCoverageCard({ data, loading, error, onRetry, days = 7, onDaysChange }) {
  if (loading) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '18px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px'
        }}
      >
        Cargando cobertura de ventas...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '18px',
          border: '1px solid var(--border-error)',
          background: 'var(--error-soft)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--error)' }}>{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              alignSelf: 'flex-start',
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '1px solid var(--error)',
              background: 'transparent',
              color: 'var(--error)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            <span>Reintentar</span>
          </button>
        )}
      </div>
    );
  }

  if (!data) return null;

  const completaPct = Number(data.receta_completa?.porcentaje || 0);
  const stockeablePct = Number(data.stockeable_mapeado?.porcentaje || 0);
  const sinCubrirPct = Number(data.sin_receta_o_incompleto?.porcentaje || 0);
  const topFaltantes = data.top_faltantes || [];

  return (
    <div
      className="glass-card"
      style={{
        padding: '18px',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* Cabecera y selector de días */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
            Cobertura de ventas
          </h3>
        </div>

        {onDaysChange && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDaysChange(d)}
                aria-pressed={days === d}
                style={{
                  padding: '4px 8px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: days === d ? 'var(--primary)' : 'var(--chip-bg)',
                  color: days === d ? 'var(--on-primary)' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {d}d
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tres barras de desglose porcentual */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Receta completa */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              Receta completa
            </span>
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>
              {data.receta_completa?.porcentaje}% ({formatUsd(data.receta_completa?.total_formateado)})
            </span>
          </div>
          <div style={{ height: '8px', width: '100%', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, completaPct)}%`, borderRadius: '9999px', background: 'var(--success)' }} />
          </div>
        </div>

        {/* Vendido directo mapeado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              Vendido directo mapeado
            </span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
              {data.stockeable_mapeado?.porcentaje}% ({formatUsd(data.stockeable_mapeado?.total_formateado)})
            </span>
          </div>
          <div style={{ height: '8px', width: '100%', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, stockeablePct)}%`, borderRadius: '9999px', background: 'var(--primary)' }} />
          </div>
        </div>

        {/* Sin cubrir */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              Sin cubrir
            </span>
            <span style={{ color: 'var(--warning)', fontWeight: 700 }}>
              {data.sin_receta_o_incompleto?.porcentaje}% ({formatUsd(data.sin_receta_o_incompleto?.total_formateado)})
            </span>
          </div>
          <div style={{ height: '8px', width: '100%', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, sinCubrirPct)}%`, borderRadius: '9999px', background: 'var(--warning)' }} />
          </div>
        </div>
      </div>

      {/* Top 10 platos faltantes */}
      {topFaltantes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} color="var(--warning)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Platos que más venden sin cobertura
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {topFaltantes.map((plato, idx) => (
              <div
                key={plato.runfood_article_id ?? idx}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{ color: 'var(--text-subtle)', fontWeight: 700, width: '18px' }}>
                    #{idx + 1}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {plato.descripcion}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--warning)' }}>
                      {plato.motivo === 'sin_receta' ? 'Sin receta' : 'Receta incompleta'}
                    </span>
                  </div>
                </div>

                <span style={{ fontWeight: 600, color: 'var(--text-main)', flexShrink: 0 }}>
                  {formatUsd(plato.total_formateado)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {topFaltantes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: 'var(--success)' }}>
          Tus ventas están 100% cubiertas por recetas.
        </div>
      )}
    </div>
  );
}
