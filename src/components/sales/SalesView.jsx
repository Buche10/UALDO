import React from 'react';
import { TrendingUp, RefreshCw, Calendar } from 'lucide-react';
import { useSales, SALES_PRESETS } from '../../hooks/useSales';
import SalesTodayCard from './SalesTodayCard';
import SalesSummary from './SalesSummary';
import SalesItemsList from './SalesItemsList';
import SalesHoursChart from './SalesHoursChart';

const PRESET_OPTIONS = [
  { id: SALES_PRESETS.DAYS_7, label: 'Últimos 7 días' },
  { id: SALES_PRESETS.DAYS_30, label: 'Últimos 30 días' },
  { id: SALES_PRESETS.MONTH, label: 'Este mes' },
  { id: SALES_PRESETS.CUSTOM, label: 'Personalizado' }
];

/**
 * Pantalla principal de analítica de ventas para el dueño (Brief 23p).
 * Integra foto de hoy, resumen del periodo, ranking de platos y ventas por hora.
 */
export default function SalesView() {
  const {
    preset,
    setPreset,
    customRange,
    setCustomRange,
    sort,
    setSort,
    summary,
    hours,
    today,
    items,
    reloadAll
  } = useSales();

  const handleCustomDateChange = (field, value) => {
    setCustomRange((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Cabecera de la sección */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="var(--accent)" />
            <span>Ventas</span>
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Lectura analítica de ventas y platos desde RunFood.
          </p>
        </div>

        <button
          type="button"
          onClick={reloadAll}
          aria-label="Actualizar datos de ventas"
          style={{
            padding: '8px',
            borderRadius: '10px',
            border: '1px solid var(--border-glass)',
            background: 'var(--chip-bg)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Foto parcial de ventas de hoy */}
      <SalesTodayCard
        data={today.data}
        loading={today.loading}
        error={today.error}
        onRetry={today.reload}
      />

      {/* Selector de periodo con botones pastilla */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div
          role="group"
          aria-label="Periodo de análisis"
          style={{
            display: 'flex',
            gap: '6px',
            background: 'var(--chip-bg)',
            padding: '4px',
            borderRadius: '14px',
            border: '1px solid var(--border-glass)',
            overflowX: 'auto'
          }}
        >
          {PRESET_OPTIONS.map((opt) => {
            const active = preset === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPreset(opt.id)}
                aria-pressed={active}
                style={{
                  flex: 1,
                  minWidth: 'max-content',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: active ? 'var(--primary)' : 'transparent',
                  color: active ? 'var(--on-primary)' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Inputs de fecha para rango personalizado */}
        {preset === SALES_PRESETS.CUSTOM && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              padding: '12px',
              borderRadius: '12px',
              background: 'var(--chip-bg)',
              border: '1px solid var(--border-glass)',
              alignItems: 'center'
            }}
          >
            <Calendar size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, fontSize: '11px', color: 'var(--text-muted)' }}>
                Desde
                <input
                  type="date"
                  value={customRange.from}
                  onChange={(e) => handleCustomDateChange('from', e.target.value)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-glass)',
                    background: 'rgba(0, 0, 0, 0.2)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    fontFamily: 'inherit'
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, fontSize: '11px', color: 'var(--text-muted)' }}>
                Hasta
                <input
                  type="date"
                  value={customRange.to}
                  onChange={(e) => handleCustomDateChange('to', e.target.value)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-glass)',
                    background: 'rgba(0, 0, 0, 0.2)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    fontFamily: 'inherit'
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Resumen del periodo seleccionado */}
      <SalesSummary
        data={summary.data}
        loading={summary.loading}
        error={summary.error}
        onRetry={summary.reload}
      />

      {/* Platos más vendidos */}
      <SalesItemsList
        items={items.items}
        loading={items.loading}
        error={items.error}
        hasMore={items.hasMore}
        onLoadMore={items.loadMore}
        onRetry={items.reload}
        sort={sort}
        onSortChange={setSort}
      />

      {/* Ventas por hora */}
      <SalesHoursChart
        data={hours.data}
        loading={hours.loading}
        error={hours.error}
        onRetry={hours.reload}
      />
    </div>
  );
}
