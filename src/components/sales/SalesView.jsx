import React, { useState } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { useSales } from '../../hooks/useSales';
import SalesSectionSelector from './SalesSectionSelector';
import SalesPeriodSelector from './SalesPeriodSelector';
import SalesDaySummaryCard from './SalesDaySummaryCard';
import SalesSummary from './SalesSummary';
import SalesItemsList from './SalesItemsList';
import SalesHoursChart from './SalesHoursChart';
import SalesStaffRanking from './SalesStaffRanking';

/**
 * Pantalla principal de analítica de ventas para el dueño (Brief 23p/27p).
 * Integra foto/resumen del día, analítica por periodo y ranking de personal.
 */
export default function SalesView() {
  const [activeSection, setActiveSection] = useState('ventas');
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    preset,
    setPreset,
    customRange,
    setCustomRange,
    activeRange,
    sort,
    setSort,
    summary,
    hours,
    today,
    items,
    reloadAll
  } = useSales({ section: activeSection });

  const handleCustomDateChange = (field, value) => {
    setCustomRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleRefresh = () => {
    if (activeSection === 'ventas') {
      reloadAll();
    } else {
      setRefreshKey((k) => k + 1);
    }
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
          onClick={handleRefresh}
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

      {/* Selector de subsecciones: Ventas vs Personal */}
      <SalesSectionSelector
        activeSection={activeSection}
        onSelectSection={setActiveSection}
      />

      {activeSection === 'ventas' ? (
        <>
          {/* Tarjeta de Resumen del Día (Hoy / Ayer / Fecha) */}
          <SalesDaySummaryCard
            todayData={today.data}
            todayLoading={today.loading}
            todayError={today.error}
            onRetryToday={today.reload}
          />

          {/* Selector de periodo de análisis */}
          <SalesPeriodSelector
            preset={preset}
            onPresetChange={setPreset}
            customRange={customRange}
            onCustomDateChange={handleCustomDateChange}
          />

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
        </>
      ) : (
        <>
          {/* Selector de periodo compartido para Personal */}
          <SalesPeriodSelector
            preset={preset}
            onPresetChange={setPreset}
            customRange={customRange}
            onCustomDateChange={handleCustomDateChange}
          />

          {/* Ranking del personal en el rango */}
          <SalesStaffRanking
            key={refreshKey}
            from={activeRange.from}
            to={activeRange.to}
            enabled={activeSection === 'personal'}
          />
        </>
      )}
    </div>
  );
}
