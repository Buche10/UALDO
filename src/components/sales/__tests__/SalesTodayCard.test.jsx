import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SalesTodayCard from '../SalesTodayCard';

describe('SalesTodayCard', () => {
  it('muestra estado de carga', () => {
    render(<SalesTodayCard loading={true} />);
    expect(screen.getByText('Cargando ventas de hoy...')).toBeInTheDocument();
  });

  it('muestra mensaje de error y boton de reintentar', () => {
    const onRetry = vi.fn();
    render(<SalesTodayCard error="Error de red" onRetry={onRetry} />);
    expect(screen.getByText('Error de red')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /reintentar/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('muestra estado vacio cuando no hay datos de hoy', () => {
    render(<SalesTodayCard data={null} />);
    expect(screen.getByText('Todavía no hay ventas de hoy desde RunFood.')).toBeInTheDocument();
  });

  it('muestra foto parcial de ventas con antiguedad y articulos', () => {
    const mockData = {
      business_date: '2026-10-30',
      minutos_desde_captura: 15,
      desactualizado: false,
      totales: {
        pedidos: 12,
        total: '240.50'
      },
      articulos: [
        {
          articulo_id: 1,
          descripcion: 'Bife de chorizo',
          cantidad: '6.000',
          total: '120.00'
        },
        {
          articulo_id: 2,
          descripcion: 'Ensalada César',
          cantidad: '4.000',
          total: '40.00'
        }
      ]
    };

    render(<SalesTodayCard data={mockData} />);
    expect(screen.getByText('Ventas de hoy')).toBeInTheDocument();
    expect(screen.getByText('Actualizado hace 15 min')).toBeInTheDocument();
    expect(screen.getByText('USD 240,50')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Bife de chorizo')).toBeInTheDocument();
    expect(screen.getByText('Ensalada César')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('muestra aviso visible cuando desactualizado es true', () => {
    const mockData = {
      business_date: '2026-10-30',
      minutos_desde_captura: 75,
      desactualizado: true,
      totales: { pedidos: 5, total: '80.00' },
      articulos: []
    };

    render(<SalesTodayCard data={mockData} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('La última lectura de RunFood tiene más de una hora.')).toBeInTheDocument();
    expect(screen.getByText('Actualizado hace 75 min')).toBeInTheDocument();
  });
});
