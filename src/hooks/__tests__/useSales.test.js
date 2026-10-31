import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSales, getPresetDates, SALES_PRESETS, formatDateIso } from '../useSales';
import * as salesClient from '../../services/salesClient';

describe('useSales hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPresetDates', () => {
    it('calcula 7 dias cerrados con referencia fija', () => {
      const base = new Date(2026, 9, 29); // 2026-10-29
      const dates = getPresetDates(SALES_PRESETS.DAYS_7, base);
      expect(dates.to).toBe('2026-10-28');
      expect(dates.from).toBe('2026-10-22');
    });

    it('calcula 30 dias cerrados con referencia fija', () => {
      const base = new Date(2026, 9, 29); // 2026-10-29
      const dates = getPresetDates(SALES_PRESETS.DAYS_30, base);
      expect(dates.to).toBe('2026-10-28');
      expect(dates.from).toBe('2026-09-29');
    });

    it('calcula este mes hasta ayer o primer dia', () => {
      const base = new Date(2026, 9, 15); // 2026-10-15
      const dates = getPresetDates(SALES_PRESETS.MONTH, base);
      expect(dates.from).toBe('2026-10-01');
      expect(dates.to).toBe('2026-10-14');
    });
  });

  describe('useSales behavior', () => {
    it('inicializa y carga en paralelo resumen, horas y foto de hoy', async () => {
      const mockSummary = { totales: { pedidos: 10, total: '200.00' }, dias: [] };
      const mockHours = { dias_en_rango: 7, horas: [] };
      const mockToday = { business_date: '2026-10-30', totales: { pedidos: 2, total: '30.00' } };
      const mockItems = {
        data: [{ id: 1, articulo_id: 1, descripcion: 'Lomo', cantidad: '5.000', total: '50.00' }],
        meta: { current_page: 1, last_page: 1, total: 1 }
      };

      vi.spyOn(salesClient, 'getSalesSummary').mockResolvedValue({ ok: true, data: mockSummary });
      vi.spyOn(salesClient, 'getSalesHours').mockResolvedValue({ ok: true, data: mockHours });
      vi.spyOn(salesClient, 'getSalesToday').mockResolvedValue({ ok: true, data: mockToday });
      vi.spyOn(salesClient, 'getSalesItems').mockResolvedValue({ ok: true, data: mockItems });

      const { result } = renderHook(() => useSales());

      await waitFor(() => {
        expect(result.current.summary.loading).toBe(false);
      });

      expect(result.current.summary.data).toEqual(mockSummary);
      expect(result.current.hours.data).toEqual(mockHours);
      expect(result.current.today.data).toEqual(mockToday);
      expect(result.current.items.items).toHaveLength(1);
    });

    it('descarta respuestas viejas si el preset o rango cambia antes de que responda', async () => {
      let resolveFirstSummary;
      const firstPromise = new Promise((resolve) => {
        resolveFirstSummary = resolve;
      });

      vi.spyOn(salesClient, 'getSalesToday').mockResolvedValue({ ok: true, data: null });
      vi.spyOn(salesClient, 'getSalesHours').mockResolvedValue({ ok: true, data: { horas: [] } });
      vi.spyOn(salesClient, 'getSalesItems').mockResolvedValue({ ok: true, data: { data: [], meta: {} } });

      const summarySpy = vi.spyOn(salesClient, 'getSalesSummary')
        .mockReturnValueOnce(firstPromise)
        .mockResolvedValueOnce({
          ok: true,
          data: { totales: { pedidos: 50, total: '999.00' }, dias: [] }
        });

      const { result } = renderHook(() => useSales());

      expect(result.current.summary.loading).toBe(true);

      // Cambiar a preset de 30 dias
      act(() => {
        result.current.setPreset(SALES_PRESETS.DAYS_30);
      });

      await waitFor(() => {
        expect(result.current.preset).toBe(SALES_PRESETS.DAYS_30);
      });

      // Se resuelve la primera petición vieja
      await act(async () => {
        resolveFirstSummary({
          ok: true,
          data: { totales: { pedidos: 5, total: '10.00' }, dias: [] }
        });
      });

      // El estado debe tener los datos de la segunda petición (30 días), no la vieja
      await waitFor(() => {
        expect(result.current.summary.data?.totales?.pedidos).toBe(50);
      });
      expect(result.current.summary.data.totales.total).toBe('999.00');
    });

    it('maneja errores en la carga de resumen y horas', async () => {
      vi.spyOn(salesClient, 'getSalesSummary').mockResolvedValue({
        ok: false,
        error: 'Error en resumen'
      });
      vi.spyOn(salesClient, 'getSalesHours').mockResolvedValue({
        ok: false,
        error: 'Error en horas'
      });
      vi.spyOn(salesClient, 'getSalesToday').mockResolvedValue({
        ok: false,
        error: 'Error en hoy'
      });
      vi.spyOn(salesClient, 'getSalesItems').mockResolvedValue({
        ok: true,
        data: { data: [], meta: {} }
      });

      const { result } = renderHook(() => useSales());

      await waitFor(() => {
        expect(result.current.summary.loading).toBe(false);
      });

      expect(result.current.summary.error).toBe('Error en resumen');
      expect(result.current.hours.error).toBe('Error en horas');
      expect(result.current.today.error).toBe('Error en hoy');
    });

    it('permite cambiar sort y rango personalizado', async () => {
      vi.spyOn(salesClient, 'getSalesSummary').mockResolvedValue({ ok: true, data: {} });
      vi.spyOn(salesClient, 'getSalesHours').mockResolvedValue({ ok: true, data: {} });
      vi.spyOn(salesClient, 'getSalesToday').mockResolvedValue({ ok: true, data: null });
      vi.spyOn(salesClient, 'getSalesItems').mockResolvedValue({
        ok: true,
        data: { data: [], meta: {} }
      });

      const { result } = renderHook(() => useSales());

      await waitFor(() => {
        expect(result.current.summary.loading).toBe(false);
      });

      act(() => {
        result.current.setSort('total');
      });

      expect(result.current.sort).toBe('total');

      act(() => {
        result.current.setPreset(SALES_PRESETS.CUSTOM);
        result.current.setCustomRange({ from: '2026-10-10', to: '2026-10-15' });
      });

      await waitFor(() => {
        expect(result.current.preset).toBe(SALES_PRESETS.CUSTOM);
        expect(result.current.activeRange).toEqual({ from: '2026-10-10', to: '2026-10-15' });
      });
    });
  });
});
