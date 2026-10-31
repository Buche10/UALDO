import React from 'react';
import { useRunfoodConsumption } from '../../hooks/useRunfoodConsumption';
import RunfoodConsumptionSettingsCard from './RunfoodConsumptionSettingsCard';
import RunfoodConsumptionDay from './RunfoodConsumptionDay';
import RunfoodRecalculateForm from './RunfoodRecalculateForm';

/**
 * Vista completa de consumo por ventas de RunFood (Brief 25p).
 */
export default function RunfoodConsumptionView({
  onNavigateToRecipes,
  onNavigateToMappings
}) {
  const {
    settings,
    settingsLoading,
    settingsError,
    saveSettings,
    date,
    setDate,
    goToPreviousDay,
    goToNextDay,
    consumption,
    consumptionLoading,
    consumptionError,
    recalculate,
    recalculating,
    recalculateResult,
    recalculateError,
    clearRecalculate
  } = useRunfoodConsumption();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Tarjeta de activacion y configuracion */}
      <RunfoodConsumptionSettingsCard
        settings={settings}
        loading={settingsLoading}
        error={settingsError}
        onSave={saveSettings}
      />

      {/* Consumo del dia */}
      <RunfoodConsumptionDay
        date={date}
        onDateChange={setDate}
        onPreviousDay={goToPreviousDay}
        onNextDay={goToNextDay}
        consumption={consumption}
        loading={consumptionLoading}
        error={consumptionError}
        onNavigateToRecipes={onNavigateToRecipes}
        onNavigateToMappings={onNavigateToMappings}
      />

      {/* Formulario de recalculo (solo cuando el consumo esta configurado) */}
      <RunfoodRecalculateForm
        loading={recalculating}
        result={recalculateResult}
        error={recalculateError}
        onRecalculate={recalculate}
        onClearResult={clearRecalculate}
      />
    </div>
  );
}
