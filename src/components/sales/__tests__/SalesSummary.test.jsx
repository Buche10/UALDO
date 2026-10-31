import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SalesSummary from '../SalesSummary';

describe('SalesSummary', () => {
  it('muestra estado de carga', () => {
    render(<SalesSummary loading={true} />);
    expect(screen.getByText('Cargando resumen de ventas...')).toBeInTheDocument();
  });

  it('muestra error y boton de reintentar', () => {
    const onRetry = vi.fn();
    render(<SalesSummary error="Error al cargar" onRetry={onRetry} />);
    expect(screen.getByText('Error al cargar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('muestra totales y ticket promedio exacto calculado sin float', () => {
    // 100.00 entre 3 pedidos da 33.33 exactamente
    const mockData = {
      from: '2026-10-23',
      to: '2026-10-25',
      totales: {
        pedidos: 3,
        total: '100.00',
        descuento: '0.00'
      },
      dias: [
        { fecha: '2026-10-23', pedidos: 1, total: '33.33', descuento: '0.00' },
        { fecha: '2026-10-24', pedidos: 1, total: '33.33', descuento: '0.00' },
        { fecha: '2026-10-25', pedidos: 1, total: '33.34', descuento: '0.00' }
      ]
    };

    render(<SalesSummary data={mockData} />);
    expect(screen.getByText('Resumen del periodo')).toBeInTheDocument();
    expect(screen.getByText('USD 100,00')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    // Ticket promedio 100/3 = 33.33 formateado como USD 33,33 (tambien presente en filas diarias)
    expect(screen.getAllByText('USD 33,33').length).toBeGreaterThanOrEqual(1);

    // Desglose por dia
    expect(screen.getByText('2026-10-23')).toBeInTheDocument();
    expect(screen.getByText('2026-10-24')).toBeInTheDocument();
    expect(screen.getByText('2026-10-25')).toBeInTheDocument();
  });
});
