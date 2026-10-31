import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  getSalesSummary,
  getSalesHours,
  getSalesItems,
  getSalesToday,
  isValidDate
} from '../services/salesClient';
import { usePagedList } from './usePagedList';

export const SALES_PRESETS = {
  DAYS_7: '7d',
  DAYS_30: '30d',
  MONTH: 'month',
  CUSTOM: 'custom'
};

/**
 * Formatea un objeto Date como cadena AAAA-MM-DD local.
 *
 * @param {Date} date
 * @returns {string}
 */
export function formatDateIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calcula el rango de fechas para cada preset tomando como referencia la fecha base.
 * Los datos cerrados toman como último día ayer.
 *
 * @param {'7d'|'30d'|'month'} preset
 * @param {Date} [baseDate]
 * @returns {{ from: string, to: string }}
 */
export function getPresetDates(preset, baseDate = new Date()) {
  const now = new Date(baseDate);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayStr = formatDateIso(yesterday);

  if (preset === SALES_PRESETS.DAYS_30) {
    const from = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() - 29);
    return { from: formatDateIso(from), to: yesterdayStr };
  }

  if (preset === SALES_PRESETS.MONTH) {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const fromStr = formatDateIso(from);
    const to = yesterday < from ? fromStr : yesterdayStr;
    return { from: fromStr, to };
  }

  // Por defecto 7 días cerrados
  const from = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() - 6);
  return { from: formatDateIso(from), to: yesterdayStr };
}

/**
 * Hook principal para la pantalla de analítica de ventas (Brief 23p).
 * Coordina la carga en paralelo de resumen, horas y foto de hoy,
 * junto con el listado paginado y ordenado de artículos.
 */
export function useSales({ initialPreset = SALES_PRESETS.DAYS_7, section = 'ventas' } = {}) {
  const [preset, setPreset] = useState(initialPreset);
  const [customRange, setCustomRange] = useState(() => getPresetDates(SALES_PRESETS.DAYS_7));
  const [sort, setSort] = useState('quantity');

  // Rango activo según el preset seleccionado
  const activeRange = useMemo(() => (
    preset === SALES_PRESETS.CUSTOM
      ? customRange
      : getPresetDates(preset)
  ), [preset, customRange]);

  // Estados de resumen del rango
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  // Estados de ventas por hora
  const [hoursData, setHoursData] = useState(null);
  const [hoursLoading, setHoursLoading] = useState(true);
  const [hoursError, setHoursError] = useState(null);

  // Estados de foto parcial de hoy
  const [todayData, setTodayData] = useState(null);
  const [todayLoading, setTodayLoading] = useState(true);
  const [todayError, setTodayError] = useState(null);

  const rangeRequestRef = useRef(0);
  const todayRequestRef = useRef(0);

  // Carga del resumen y horas en paralelo, cancelando respuestas viejas si el rango cambia
  const loadRangeData = useCallback(async (range) => {
    if (!range?.from || !range?.to || !isValidDate(range.from) || !isValidDate(range.to)) {
      return;
    }

    const reqId = ++rangeRequestRef.current;
    setSummaryLoading(true);
    setSummaryError(null);
    setHoursLoading(true);
    setHoursError(null);

    getSalesSummary(range).then((res) => {
      if (reqId !== rangeRequestRef.current) return;
      setSummaryLoading(false);
      if (res.ok) {
        setSummaryData(res.data);
      } else {
        setSummaryError(res.error || 'No se pudo cargar el resumen de ventas.');
      }
    });

    getSalesHours(range).then((res) => {
      if (reqId !== rangeRequestRef.current) return;
      setHoursLoading(false);
      if (res.ok) {
        setHoursData(res.data);
      } else {
        setHoursError(res.error || 'No se pudieron cargar las ventas por hora.');
      }
    });
  }, []);

  // Carga de la foto parcial de hoy
  const loadTodayData = useCallback(async () => {
    const reqId = ++todayRequestRef.current;
    setTodayLoading(true);
    setTodayError(null);

    const res = await getSalesToday();
    if (reqId !== todayRequestRef.current) return;

    setTodayLoading(false);
    if (res.ok) {
      setTodayData(res.data);
    } else {
      setTodayError(res.error || 'No se pudo cargar la información de hoy.');
    }
  }, []);

  useEffect(() => {
    if (section === 'ventas') {
      loadRangeData(activeRange);
    }
  }, [section, activeRange, loadRangeData]);

  useEffect(() => {
    if (section === 'ventas') {
      loadTodayData();
    }
  }, [section, loadTodayData]);

  // Artículos paginados con usePagedList
  const fetchItemsPage = useCallback(
    (page) => {
      if (section !== 'ventas') {
        return Promise.resolve({
          ok: true,
          data: { data: [], meta: { current_page: 1, last_page: 1, total: 0 } }
        });
      }
      return getSalesItems({
        from: activeRange.from,
        to: activeRange.to,
        sort,
        page
      });
    },
    [section, activeRange.from, activeRange.to, sort]
  );

  const items = usePagedList(fetchItemsPage, {
    errorMessage: 'No se pudieron cargar los artículos vendidos.'
  });

  const reloadSummary = useCallback(() => {
    loadRangeData(activeRange);
  }, [activeRange, loadRangeData]);

  const reloadHours = useCallback(() => {
    loadRangeData(activeRange);
  }, [activeRange, loadRangeData]);

  const itemsReload = items.reload;
  const reloadAll = useCallback(() => {
    loadRangeData(activeRange);
    loadTodayData();
    itemsReload();
  }, [activeRange, loadRangeData, loadTodayData, itemsReload]);

  return {
    preset,
    setPreset,
    customRange,
    setCustomRange,
    activeRange,
    sort,
    setSort,
    summary: {
      data: summaryData,
      loading: summaryLoading,
      error: summaryError,
      reload: reloadSummary
    },
    hours: {
      data: hoursData,
      loading: hoursLoading,
      error: hoursError,
      reload: reloadHours
    },
    today: {
      data: todayData,
      loading: todayLoading,
      error: todayError,
      reload: loadTodayData
    },
    items,
    reloadAll
  };
}
