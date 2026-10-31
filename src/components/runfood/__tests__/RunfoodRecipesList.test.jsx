import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RunfoodRecipesList from '../RunfoodRecipesList';
import * as client from '../../../services/runfoodCatalogClient';

describe('RunfoodRecipesList', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, 'getRunfoodCoverage').mockResolvedValue({ ok: true, data: {} });
  });

  it('renderiza recetas, permite desplegar lineas y avisa opciones', async () => {
    const mockRecipes = {
      data: [
        {
          id: 1,
          codigo: 'R01',
          descripcion: 'Lomo a la plancha',
          articulo_final: { descripcion: 'Plato Lomo 300g' },
          tiene_opciones: true,
          estado: 'con_opciones',
          lineas: [
            {
              linea: 1,
              descripcion_runfood: 'Lomo fino kg',
              cantidad: '0.300000',
              mapeo: {
                status: 'confirmed',
                factor: '1.000000',
                insumo: { id: 45, name: 'Lomo Fino', unit: 'kg' }
              }
            },
            {
              linea: 2,
              descripcion_runfood: 'Papas fritas porcion',
              cantidad: '1.000000',
              mapeo: null // Sin asociar
            }
          ]
        }
      ],
      meta: { current_page: 1, last_page: 1, total: 1 }
    };

    vi.spyOn(client, 'listRunfoodRecipes').mockResolvedValueOnce({ ok: true, data: mockRecipes });
    const onResolveMapping = vi.fn();

    render(<RunfoodRecipesList onResolveMapping={onResolveMapping} />);

    await waitFor(() => {
      expect(screen.getByText('Lomo a la plancha')).toBeInTheDocument();
      expect(screen.getByText('Plato: Plato Lomo 300g')).toBeInTheDocument();
      expect(screen.getAllByText('Con opciones').length).toBeGreaterThanOrEqual(2);
    });

    // Desplegar acordeon
    const headerBtn = screen.getByRole('button', { name: /lomo a la plancha/i });
    fireEvent.click(headerBtn);

    // Aviso de opciones
    expect(screen.getByRole('note')).toHaveTextContent('Tiene opciones a elegir: solo se descuenta la parte fija.');

    // Líneas
    expect(screen.getByText('Lomo fino kg')).toBeInTheDocument();
    expect(screen.getByText('Lomo Fino')).toBeInTheDocument();
    expect(screen.getByText('x1.000000 kg')).toBeInTheDocument();

    // Línea sin asociar
    expect(screen.getByText('Papas fritas porcion')).toBeInTheDocument();
    expect(screen.getByText('Sin asociar')).toBeInTheDocument();

    const asociarBtn = screen.getByRole('button', { name: 'Asociar' });
    fireEvent.click(asociarBtn);
    expect(onResolveMapping).toHaveBeenCalledTimes(1);
  });

  it('permite filtrar por estado con pastillas', async () => {
    vi.spyOn(client, 'listRunfoodRecipes').mockResolvedValue({
      ok: true,
      data: { data: [], meta: { current_page: 1, last_page: 1 } }
    });

    render(<RunfoodRecipesList />);

    const completasBtn = screen.getByRole('button', { name: 'Completas' });
    fireEvent.click(completasBtn);

    await waitFor(() => {
      expect(client.listRunfoodRecipes).toHaveBeenCalledWith(expect.objectContaining({ estado: 'completa' }));
    });
  });
});
