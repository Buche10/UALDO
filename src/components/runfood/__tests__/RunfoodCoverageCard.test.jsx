import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RunfoodCoverageCard from '../RunfoodCoverageCard';

describe('RunfoodCoverageCard', () => {
  it('muestra estado de carga', () => {
    render(<RunfoodCoverageCard loading={true} />);
    expect(screen.getByText('Cargando cobertura de ventas...')).toBeInTheDocument();
  });

  it('muestra error y boton de reintentar', () => {
    const onRetry = vi.fn();
    render(<RunfoodCoverageCard error="Error de red" onRetry={onRetry} />);
    expect(screen.getByText('Error de red')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renderiza barras de porcentaje y platos faltantes', () => {
    const mockData = {
      dias_analizados: 7,
      receta_completa: { total_formateado: '1050.00', porcentaje: '70.00' },
      stockeable_mapeado: { total_formateado: '300.00', porcentaje: '20.00' },
      sin_receta_o_incompleto: { total_formateado: '150.00', porcentaje: '10.00' },
      top_faltantes: [
        {
          runfood_article_id: 101,
          descripcion: 'Hamburguesa Doble',
          total_formateado: '100.00',
          motivo: 'sin_receta'
        },
        {
          runfood_article_id: 102,
          descripcion: 'Combo Parrillero',
          total_formateado: '50.00',
          motivo: 'receta_incompleta'
        }
      ]
    };

    render(<RunfoodCoverageCard data={mockData} days={7} onDaysChange={vi.fn()} />);

    expect(screen.getByText('Cobertura de ventas')).toBeInTheDocument();
    expect(screen.getByText(/70.00%/)).toBeInTheDocument();
    expect(screen.getByText(/20.00%/)).toBeInTheDocument();
    expect(screen.getByText(/10.00%/)).toBeInTheDocument();

    // Platos faltantes
    expect(screen.getByText('Hamburguesa Doble')).toBeInTheDocument();
    expect(screen.getByText('Sin receta')).toBeInTheDocument();
    expect(screen.getByText('Combo Parrillero')).toBeInTheDocument();
    expect(screen.getByText('Receta incompleta')).toBeInTheDocument();
  });

  it('muestra mensaje de 100% cuando no hay platos faltantes', () => {
    const mockData = {
      receta_completa: { porcentaje: '100.00', total_formateado: '500.00' },
      stockeable_mapeado: { porcentaje: '0.00', total_formateado: '0.00' },
      sin_receta_o_incompleto: { porcentaje: '0.00', total_formateado: '0.00' },
      top_faltantes: []
    };

    render(<RunfoodCoverageCard data={mockData} />);
    expect(screen.getByText('Tus ventas están 100% cubiertas por recetas.')).toBeInTheDocument();
  });
});
