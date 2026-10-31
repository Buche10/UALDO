import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SalesHoursChart from '../SalesHoursChart';

describe('SalesHoursChart', () => {
  it('muestra estado de carga', () => {
    render(<SalesHoursChart loading={true} />);
    expect(screen.getByText('Cargando ventas por hora...')).toBeInTheDocument();
  });

  it('muestra estado vacio si no hay horas con ventas', () => {
    const mockData = {
      dias_en_rango: 7,
      horas: [
        { hora: 10, total: '0.00', pedidos_total: 0 },
        { hora: 11, total: '0.00', pedidos_total: 0 }
      ]
    };
    render(<SalesHoursChart data={mockData} />);
    expect(screen.getByText('Sin actividad de ventas por hora en este periodo.')).toBeInTheDocument();
  });

  it('renderiza solo horas con ventas y resalta la hora pico', () => {
    const mockData = {
      dias_en_rango: 7,
      horas: [
        { hora: 9, total: '0.00', pedidos_total: 0 },
        { hora: 12, total: '150.00', total_promedio: '21.40', pedidos_total: 10 },
        { hora: 13, total: '450.00', total_promedio: '64.30', pedidos_total: 25 }, // pico
        { hora: 14, total: '200.00', total_promedio: '28.50', pedidos_total: 12 }
      ]
    };

    render(<SalesHoursChart data={mockData} />);
    expect(screen.getByText('Ventas por hora')).toBeInTheDocument();

    // Solo aparecen 12, 13 y 14; 9 no aparece
    expect(screen.queryByText('09:00')).not.toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.getByText('13:00')).toBeInTheDocument();
    expect(screen.getByText('14:00')).toBeInTheDocument();

    // Distintivo de hora pico
    expect(screen.getByText('Pico')).toBeInTheDocument();

    // Accesibilidad: aria-label en cada barra
    const peakBar = screen.getByRole('img', { name: /hora 13:00.*hora pico/i });
    expect(peakBar).toBeInTheDocument();
  });

  it('permite reintentar en error', () => {
    const onRetry = vi.fn();
    render(<SalesHoursChart error="Error de red" onRetry={onRetry} />);
    expect(screen.getByText('Error de red')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
