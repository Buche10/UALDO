import React from 'react';
import { Clock, RefreshCw, Sparkles } from 'lucide-react';
import { formatUsd } from '../../services/money';

/**
 * Gráfico de ventas por hora mediante barras horizontales puras en CSS (Brief 23p).
 * Filtra únicamente las horas con ventas activas y resalta la hora pico del periodo.
 */
export default function SalesHoursChart({ data, loading, error, onRetry }) {
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
        Cargando ventas por hora...
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

  const rawHours = data?.horas || [];
  const activeHours = rawHours.filter((h) => {
    const total = Number(h.total || 0);
    const pedidos = Number(h.pedidos_total || 0);
    return total > 0 || pedidos > 0;
  });

  // Identificar la hora pico (mayor total vendido)
  let maxTotal = 0;
  let peakHour = null;
  activeHours.forEach((h) => {
    const tot = Number(h.total || 0);
    if (tot > maxTotal) {
      maxTotal = tot;
      peakHour = h.hora;
    }
  });

  return (
    <div
      className="glass-card"
      style={{
        padding: '18px',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
            Ventas por hora
          </h3>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Promedio diario
        </span>
      </div>

      {activeHours.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Sin actividad de ventas por hora en este periodo.
        </div>
      ) : (
        /* Barras de horas activas */
        <div
          role="region"
          aria-label="Distribución de ventas por hora"
          style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          {activeHours.map((h) => {
            const isPeak = h.hora === peakHour;
            const tot = Number(h.total || 0);
            const pct = maxTotal > 0 ? Math.max(6, Math.round((tot / maxTotal) * 100)) : 0;
            const hourLabel = `${String(h.hora).padStart(2, '0')}:00`;
            const ariaText = `Hora ${hourLabel}: total ${formatUsd(h.total)}, promedio diario ${formatUsd(h.total_promedio)}, ${h.pedidos_total ?? 0} pedidos${isPeak ? ', hora pico' : ''}`;

            return (
              <div
                key={h.hora}
                tabIndex={0}
                role="img"
                aria-label={ariaText}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  background: isPeak ? 'rgba(98, 201, 200, 0.08)' : 'transparent',
                  border: isPeak ? '1px solid var(--border-glow)' : '1px solid transparent'
                }}
              >
                {/* Etiqueta de hora y montos */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 600, color: isPeak ? 'var(--accent)' : 'var(--text-main)', width: '42px' }}>
                      {hourLabel}
                    </span>
                    {isPeak && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          background: 'var(--accent)',
                          color: 'var(--ualdo-negro)',
                          fontSize: '10px',
                          fontWeight: 700
                        }}
                      >
                        <Sparkles size={10} />
                        Pico
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      {h.pedidos_total} ped.
                    </span>
                    <span style={{ fontWeight: 600, color: isPeak ? 'var(--accent)' : 'var(--text-main)' }}>
                      {formatUsd(h.total)}
                    </span>
                  </div>
                </div>

                {/* Barra de progreso CSS */}
                <div
                  style={{
                    height: '8px',
                    width: '100%',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      borderRadius: '9999px',
                      background: isPeak ? 'var(--grad-primary)' : 'var(--primary)',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
