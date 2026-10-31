import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SalesDaySummaryCard from '../SalesDaySummaryCard';
import * as salesClient from '../../../services/salesClient';

describe('SalesDaySummaryCard (Brief 27p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra la hora de captura cuando el modo es Hoy y los datos son parciales', () => {
    const todayData = {
      resumen: {
        fecha: '2026-10-30',
        tipo: 'parcial',
        capturada_a: '2026-10-30T14:20:00',
        total: '1240.50',
        pedidos: 96,
        ticket_promedio: '12.92',
        mesas: 61,
        propina: '34.00',
        descuento: '12.00',
        anulados: { pedidos: 3, total: '27.50' },
        top_platos: [{ descripcion: 'Lomo fino', cantidad: '18.000', total: '324.00' }],
        top_empleados: [{ runfood_user_id: 4, nombre: 'Maria', pedidos: 31, total: '402.10', participacion: '32.4' }],
        hora_pico: { hora: 13, pedidos: 22, total: '310.00' },
        formas_pago: [{ forma: 'Efectivo', total: '640.00' }]
      }
    };

    render(<SalesDaySummaryCard todayData={todayData} todayLoading={false} />);

    expect(screen.getByText('Resumen del día')).toBeInTheDocument();
    expect(screen.getByText('Ventas de hoy')).toBeInTheDocument();
    expect(screen.getByText(/Parcial, actualizado a las 14:20/)).toBeInTheDocument();
    expect(screen.getByText('USD 1.240,50')).toBeInTheDocument();
    expect(screen.getByText('96')).toBeInTheDocument();
    expect(screen.getByText('1. Lomo fino')).toBeInTheDocument();
    expect(screen.getByText(/Maria/)).toBeInTheDocument();
    expect(screen.getByText(/13:00 hrs/)).toBeInTheDocument();
    expect(screen.getByText('Efectivo')).toBeInTheDocument();
  });

  it('muestra "No disponible" cuando las cifras llegan en null', () => {
    const todayData = {
      resumen: {
        fecha: '2026-10-30',
        tipo: 'cierre',
        total: null,
        pedidos: null,
        ticket_promedio: null,
        mesas: null,
        propina: null,
        descuento: null,
        anulados: null,
        top_platos: null,
        top_empleados: null,
        hora_pico: null,
        formas_pago: null
      }
    };

    render(<SalesDaySummaryCard todayData={todayData} todayLoading={false} />);

    const noDisponibleItems = screen.getAllByText('No disponible');
    expect(noDisponibleItems.length).toBeGreaterThanOrEqual(7);
  });

  it('al elegir Ayer o Fecha consulta getSalesDay y muestra mensaje específico ante 404', async () => {
    vi.spyOn(salesClient, 'getSalesDay').mockResolvedValueOnce({
      ok: false,
      status: 404,
      error: 'No hay cierre de ventas para ese día'
    });

    render(<SalesDaySummaryCard todayData={null} todayLoading={false} />);

    const ayerBtn = screen.getByRole('button', { name: 'Ayer' });
    fireEvent.click(ayerBtn);

    await waitFor(() => {
      expect(salesClient.getSalesDay).toHaveBeenCalled();
      expect(screen.getByText('No hay cierre de ventas para ese día')).toBeInTheDocument();
    });
  });

  it('tocar dos veces "Ayer" con la petición en vuelo termina mostrando el resumen', async () => {
    let resolvePromise;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.spyOn(salesClient, 'getSalesDay').mockImplementation(() => pendingPromise);

    render(<SalesDaySummaryCard todayData={null} todayLoading={false} />);

    const ayerBtn = screen.getByRole('button', { name: 'Ayer' });
    fireEvent.click(ayerBtn);
    expect(screen.getByText('Cargando resumen...')).toBeInTheDocument();

    // Segundo toque en el mismo modo con la petición en vuelo
    fireEvent.click(ayerBtn);

    resolvePromise({
      ok: true,
      data: {
        fecha: '2026-10-29',
        total: '950.00',
        pedidos: 50,
        ticket_promedio: '19.00',
        top_platos: [],
        top_empleados: []
      }
    });

    await waitFor(() => {
      expect(screen.getByText('USD 950,00')).toBeInTheDocument();
      expect(screen.queryByText('Cargando resumen...')).not.toBeInTheDocument();
    });
  });

  it('permite elegir una fecha específica en el input date', async () => {
    vi.spyOn(salesClient, 'getSalesDay').mockResolvedValue({
      ok: true,
      data: {
        fecha: '2026-10-15',
        total: '850.00',
        pedidos: 40,
        top_platos: [],
        top_empleados: []
      }
    });

    render(<SalesDaySummaryCard todayData={null} todayLoading={false} />);

    const fechaBtn = screen.getByRole('button', { name: 'Fecha' });
    fireEvent.click(fechaBtn);

    const dateInput = screen.getByLabelText('Elegir fecha de resumen');
    fireEvent.change(dateInput, { target: { value: '2026-10-15' } });

    await waitFor(() => {
      expect(screen.getByText('USD 850,00')).toBeInTheDocument();
    });
  });

  it('muestra aviso de foto desactualizada cuando todayData.desactualizado es true', () => {
    const todayData = {
      desactualizado: true,
      resumen: {
        fecha: '2026-10-30',
        tipo: 'parcial',
        total: '100.00',
        pedidos: 5
      }
    };

    render(<SalesDaySummaryCard todayData={todayData} todayLoading={false} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('La última lectura de RunFood tiene más de una hora.')).toBeInTheDocument();
  });

  it('muestra "Aún no hay datos de hoy" cuando /sales/today llega sin resumen', () => {
    const todayData = {
      desactualizado: false,
      resumen: null
    };

    render(<SalesDaySummaryCard todayData={todayData} todayLoading={false} />);

    expect(screen.getByText('Aún no hay datos de hoy')).toBeInTheDocument();
  });

  it('muestra "Elige una fecha" y no llama a la API cuando el input de fecha está vacío', async () => {
    const spy = vi.spyOn(salesClient, 'getSalesDay');

    render(<SalesDaySummaryCard todayData={null} todayLoading={false} />);

    const fechaBtn = screen.getByRole('button', { name: 'Fecha' });
    fireEvent.click(fechaBtn);

    const dateInput = screen.getByLabelText('Elegir fecha de resumen');
    fireEvent.change(dateInput, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByText('Elige una fecha')).toBeInTheDocument();
    });
    expect(spy).not.toHaveBeenCalledWith({ fecha: '' });
  });

  it('muestra "Cargando resumen..." durante la carga en cualquier modo', () => {
    render(<SalesDaySummaryCard todayData={null} todayLoading={true} />);
    expect(screen.getByText('Cargando resumen...')).toBeInTheDocument();
  });

  it('descarta respuestas fuera de orden entre peticiones', async () => {
    let resolveFirst;
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    vi.spyOn(salesClient, 'getSalesDay').mockImplementation(({ fecha }) => {
      if (fecha === '2026-10-10') return firstPromise;
      if (fecha === '2026-10-20') {
        return Promise.resolve({
          ok: true,
          data: { fecha: '2026-10-20', total: '200.00', pedidos: 10 }
        });
      }
      return Promise.resolve({
        ok: true,
        data: { fecha, total: '100.00', pedidos: 5 }
      });
    });

    render(<SalesDaySummaryCard todayData={null} todayLoading={false} />);

    const fechaBtn = screen.getByRole('button', { name: 'Fecha' });
    fireEvent.click(fechaBtn);

    const dateInput = screen.getByLabelText('Elegir fecha de resumen');
    // Primera petición (lenta)
    fireEvent.change(dateInput, { target: { value: '2026-10-10' } });
    // Segunda petición (rápida)
    fireEvent.change(dateInput, { target: { value: '2026-10-20' } });

    await waitFor(() => {
      expect(screen.getByText('USD 200,00')).toBeInTheDocument();
    });

    // Se resuelve la primera petición después de la segunda
    resolveFirst({
      ok: true,
      data: { fecha: '2026-10-10', total: '999.00', pedidos: 50 }
    });

    // El componente debe mantener los datos de la segunda petición (200, no 999)
    await waitFor(() => {
      expect(screen.getByText('USD 200,00')).toBeInTheDocument();
      expect(screen.queryByText('USD 999,00')).not.toBeInTheDocument();
    });
  });
});
