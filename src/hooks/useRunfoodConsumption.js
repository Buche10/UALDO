import { useState, useCallback, useEffect } from 'react';
import {
  getConsumptionSettings,
  updateConsumptionSettings,
  getConsumption,
  recalculateConsumption,
  getYesterdayIsoString,
  toIsoDateString,
  parseIsoDateParts
} from '../services/runfoodConsumptionClient';

/**
 * Obtiene la fecha desplazada un numero de dias respecto a una fecha ISO.
 *
 * @param {string} isoDate
 * @param {number} daysDelta
 * @returns {string}
 */
export function shiftIsoDate(isoDate, daysDelta) {
  const parts = parseIsoDateParts(isoDate);
  if (!parts) return isoDate;
  const dt = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  dt.setUTCDate(dt.getUTCDate() + daysDelta);
  return toIsoDateString(new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
}

/**
 * Hook para la gestion de consumo automatico por ventas (Brief 25p).
 *
 * @param {{ initialDate?: string }} [options]
 */
export function useRunfoodConsumption({ initialDate } = {}) {
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState(null);

  const [date, setDate] = useState(() => initialDate || getYesterdayIsoString());
  const [consumption, setConsumption] = useState(null);
  const [consumptionLoading, setConsumptionLoading] = useState(false);
  const [consumptionError, setConsumptionError] = useState(null);

  const [recalculating, setRecalculating] = useState(false);
  const [recalculateResult, setRecalculateResult] = useState(null);
  const [recalculateError, setRecalculateError] = useState(null);

  // Carga de ajustes de consumo
  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      const res = await getConsumptionSettings();
      if (!res.ok) {
        setSettingsError(res.error || res.data?.message || 'No se pudieron cargar los ajustes.');
        return { ok: false };
      }
      setSettings(res.data);
      return { ok: true, data: res.data };
    } catch (err) {
      const msg = err?.message || 'Error de conexion al cargar ajustes.';
      setSettingsError(msg);
      return { ok: false, error: msg };
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // Carga del consumo de una fecha
  const loadConsumption = useCallback(async (targetDate = date) => {
    setConsumptionLoading(true);
    setConsumptionError(null);
    try {
      const res = await getConsumption(targetDate);
      if (!res.ok) {
        setConsumptionError(res.error || res.data?.message || 'No se pudo cargar el consumo.');
        return { ok: false };
      }
      setConsumption(res.data);
      return { ok: true, data: res.data };
    } catch (err) {
      const msg = err?.message || 'Error de conexion al consultar consumo.';
      setConsumptionError(msg);
      return { ok: false, error: msg };
    } finally {
      setConsumptionLoading(false);
    }
  }, [date]);

  // Guardado de ajustes
  const saveSettings = useCallback(async (payload) => {
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      const res = await updateConsumptionSettings(payload);
      if (!res.ok) {
        const msg = res.error || res.data?.message || 'No se pudieron guardar los ajustes.';
        setSettingsError(msg);
        return { ok: false, error: msg };
      }
      setSettings(res.data);
      loadConsumption(date);
      return { ok: true, data: res.data };
    } catch (err) {
      const msg = err?.message || 'Error al guardar los ajustes.';
      setSettingsError(msg);
      return { ok: false, error: msg };
    } finally {
      setSettingsLoading(false);
    }
  }, [date, loadConsumption]);

  // Recalculo para un rango de fechas
  const recalculate = useCallback(async ({ desde, hasta }) => {
    setRecalculating(true);
    setRecalculateError(null);
    setRecalculateResult(null);
    try {
      const res = await recalculateConsumption({ desde, hasta });
      if (!res.ok) {
        const msg = res.error || res.data?.message || 'No se pudo iniciar el recalculo.';
        setRecalculateError(msg);
        return { ok: false, error: msg };
      }
      setRecalculateResult(res.data);
      return { ok: true, data: res.data };
    } catch (err) {
      const msg = err?.message || 'Error al solicitar el recalculo.';
      setRecalculateError(msg);
      return { ok: false, error: msg };
    } finally {
      setRecalculating(false);
    }
  }, []);

  const clearRecalculate = useCallback(() => {
    setRecalculateResult(null);
    setRecalculateError(null);
  }, []);

  // Navegacion entre dias
  const goToPreviousDay = useCallback(() => {
    setDate((prev) => shiftIsoDate(prev, -1));
  }, []);

  const goToNextDay = useCallback(() => {
    setDate((prev) => shiftIsoDate(prev, 1));
  }, []);

  // Carga inicial
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (date) {
      loadConsumption(date);
    }
  }, [date, loadConsumption]);

  return {
    settings,
    settingsLoading,
    settingsError,
    loadSettings,
    saveSettings,
    date,
    setDate,
    goToPreviousDay,
    goToNextDay,
    consumption,
    consumptionLoading,
    consumptionError,
    loadConsumption,
    recalculate,
    recalculating,
    recalculateResult,
    recalculateError,
    clearRecalculate
  };
}
