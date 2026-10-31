import React from 'react';
import { Clock, AlertTriangle, RefreshCw, Flame } from 'lucide-react';
import { formatUsd } from '../../services/money';
import { formatQuantity } from '../../services/quantityFormat';

/**
 * Tarjeta de la foto parcial de ventas del día en curso (Brief 23p).
 * Muestra totales de hoy, antigüedad de la captura, aviso si está desactualizada
 * y los 5 platos más vendidos hasta el momento.
 */
export default function SalesTodayCard({ data, loading, error, onRetry }) {
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
        Cargando ventas de hoy...
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

  if (!data) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '18px',
          border: '1px solid var(--border-glass)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
            Ventas de hoy
          </h3>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Todavía no hay ventas de hoy desde RunFood.
        </p>
      </div>
    );
  }

  const minutos = data.minutos_desde_captura;
  let tiempoTexto = 'Actualizado hoy';
  if (minutos !== undefined && minutos !== null) {
    if (minutos === 0) {
      tiempoTexto = 'Actualizado hace menos de un minuto';
    } else if (minutos === 1) {
      tiempoTexto = 'Actualizado hace 1 min';
    } else {
      tiempoTexto = `Actualizado hace ${minutos} min`;
    }
  }

  const articulos = (data.articulos || data.top_articulos || []).slice(0, 5);

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
      {/* Cabecera de la tarjeta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
            Ventas de hoy
          </h3>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {tiempoTexto}
        </span>
      </div>

      {/* Aviso de foto desactualizada */}
      {data.desactualizado && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'var(--warning-soft)',
            border: '1px solid var(--border-warning)',
            color: 'var(--warning)',
            fontSize: '12px',
            fontWeight: 500
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>La última lectura de RunFood tiene más de una hora.</span>
        </div>
      )}

      {/* Métricas clave de hoy */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div
          style={{
            padding: '12px',
            borderRadius: '10px',
            background: 'var(--chip-bg)',
            border: '1px solid var(--border-glass)'
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total vendido
          </span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>
            {formatUsd(data.totales?.total)}
          </span>
        </div>

        <div
          style={{
            padding: '12px',
            borderRadius: '10px',
            background: 'var(--chip-bg)',
            border: '1px solid var(--border-glass)'
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Pedidos
          </span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
            {data.totales?.pedidos ?? 0}
          </span>
        </div>
      </div>

      {/* Top 5 platos más vendidos */}
      {articulos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={14} color="var(--accent)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Platos más vendidos hoy
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {articulos.map((art, idx) => (
              <div
                key={art.articulo_id ?? art.id ?? idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, width: '16px' }}>
                    {idx + 1}.
                  </span>
                  <span
                    style={{
                      color: 'var(--text-main)',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={art.descripcion}
                  >
                    {art.descripcion}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {formatQuantity(art.cantidad)}
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {formatUsd(art.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
