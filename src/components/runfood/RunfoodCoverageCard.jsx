import React from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import CoverageBar from './CoverageBar';
import CoverageMissingList from './CoverageMissingList';

/**
 * Tarjeta de cobertura de ventas por recetas (Brief 24p-fix).
 * Muestra el porcentaje de ventas cubiertas por receta completa, venta directa o sin cubrir,
 * y los 10 platos sin receta o incompletos con mayores ventas.
 */
export default function RunfoodCoverageCard({
  data,
  loading,
  error,
  onRetry,
  days = 7,
  onDaysChange
}) {
  if (loading) {
    return (
      <div
        className="glass-card"
        style={{
          padding: 18,
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 13
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
          padding: 18,
          border: '1px solid var(--border-error)',
          background: 'var(--error-soft)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: 'var(--error)' }}>{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              alignSelf: 'flex-start',
              padding: '6px 12px',
              borderRadius: 9999,
              border: '1px solid var(--error)',
              background: 'transparent',
              color: 'var(--error)',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
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

  const totalCents = Number(data.total_cents || 0);
  const topFaltantes = data.top_faltantes || [];

  return (
    <div
      className="glass-card"
      style={{
        padding: 18,
        border: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
    >
      {/* Cabecera y selector de días */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={18} stroke="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
            Cobertura de ventas
          </h3>
        </div>

        {onDaysChange && (
          <div style={{ display: 'flex', gap: 4 }}>
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDaysChange(d)}
                aria-pressed={days === d}
                style={{
                  padding: '4px 8px',
                  borderRadius: 9999,
                  border: 'none',
                  background: days === d ? 'var(--primary)' : 'var(--chip-bg)',
                  color: days === d ? 'var(--on-primary)' : 'var(--text-muted)',
                  fontSize: 11,
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <CoverageBar
          label="Receta completa"
          pctRaw={data.receta_completa?.porcentaje}
          amountFormatted={data.receta_completa?.total_formateado}
          colorVar="var(--success)"
        />
        <CoverageBar
          label="Vendido directo mapeado"
          pctRaw={data.stockeable_mapeado?.porcentaje}
          amountFormatted={data.stockeable_mapeado?.total_formateado}
          colorVar="var(--primary)"
        />
        <CoverageBar
          label="Sin cubrir"
          pctRaw={data.sin_receta_o_incompleto?.porcentaje}
          amountFormatted={data.sin_receta_o_incompleto?.total_formateado}
          colorVar="var(--warning)"
        />
      </div>

      {/* Top 10 platos faltantes */}
      <CoverageMissingList items={topFaltantes} />

      {/* Mensaje de estado cuando no hay platos faltantes */}
      {topFaltantes.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: 8,
            fontSize: 12,
            color: totalCents === 0 ? 'var(--text-muted)' : 'var(--success)'
          }}
        >
          {totalCents === 0
            ? 'No hay ventas en este periodo.'
            : 'Tus ventas están 100% cubiertas por recetas.'}
        </div>
      )}
    </div>
  );
}
