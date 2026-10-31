import React from 'react';
import { Calendar, RefreshCw, DollarSign, ShoppingBag, Receipt } from 'lucide-react';
import { formatUsd, calculateAverageTicket } from '../../services/money';

/**
 * Tarjeta de resumen de ventas para el rango seleccionado (Brief 23p).
 * Muestra totales globales (total, pedidos, ticket promedio exacto)
 * y desglose diario.
 */
export default function SalesSummary({ data, loading, error, onRetry }) {
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
        Cargando resumen de ventas...
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

  const totales = data?.totales;
  const dias = data?.dias || [];
  const ticketPromedio = calculateAverageTicket(totales?.total, totales?.pedidos);

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
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Calendar size={18} color="var(--accent)" />
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
          Resumen del periodo
        </h3>
      </div>

      {!data || !data.totales ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Sin datos de resumen para el periodo seleccionado.
        </div>
      ) : (
        <>
          {/* Métricas clave */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div
              style={{
                padding: '10px',
                borderRadius: '10px',
                background: 'var(--chip-bg)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DollarSign size={12} color="var(--accent)" />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Total
                </span>
              </div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)' }}>
                {formatUsd(totales.total)}
              </span>
            </div>

            <div
              style={{
                padding: '10px',
                borderRadius: '10px',
                background: 'var(--chip-bg)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShoppingBag size={12} color="var(--accent)" />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Pedidos
                </span>
              </div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                {totales.pedidos ?? 0}
              </span>
            </div>

            <div
              style={{
                padding: '10px',
                borderRadius: '10px',
                background: 'var(--chip-bg)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Receipt size={12} color="var(--accent)" />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Ticket prom.
                </span>
              </div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                {formatUsd(ticketPromedio)}
              </span>
            </div>
          </div>

          {/* Desglose diario */}
          {dias.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Desglose por día
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {dias.map((dia) => (
                  <div
                    key={dia.fecha}
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
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {dia.fecha}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {dia.pedidos} {dia.pedidos === 1 ? 'pedido' : 'pedidos'}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                        {formatUsd(dia.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
