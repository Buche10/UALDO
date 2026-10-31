import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RunfoodRecipesView from '../RunfoodRecipesView';
import * as client from '../../../services/runfoodCatalogClient';
import * as consumptionClient from '../../../services/runfoodConsumptionClient';

describe('RunfoodRecipesView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, 'getRunfoodCoverage').mockResolvedValue({
      ok: true,
      data: {
        dias_analizados: 7,
        total_cents: 100000,
        receta_completa: { porcentaje: '75.00', total_formateado: '750.00' },
        stockeable_mapeado: { porcentaje: '15.00', total_formateado: '150.00' },
        sin_receta_o_incompleto: { porcentaje: '10.00', total_formateado: '100.00' }
      }
    });
    vi.spyOn(client, 'listRunfoodMappings').mockResolvedValue({
      ok: true,
      data: { data: [], meta: { total: 0 } }
    });
    vi.spyOn(client, 'listRunfoodRecipes').mockResolvedValue({
      ok: true,
      data: {
        data: [
          {
            id: 1,
            descripcion: 'Lomo saltado',
            estado: 'incompleta',
            lineas: [
              {
                linea: 1,
                descripcion_runfood: 'Cebolla morada',
                cantidad: '0.100000',
                mapeo: null
              }
            ]
          }
        ],
        meta: { total: 1 }
      }
    });
    vi.spyOn(consumptionClient, 'getConsumptionSettings').mockResolvedValue({
      ok: true,
      data: { enabled: true, start_date: '2026-10-01', location: 'kitchen' }
    });
    vi.spyOn(consumptionClient, 'getConsumption').mockResolvedValue({
      ok: true,
      data: {
        fecha: '2026-10-29',
        estado: 'aplicado',
        lineas: [],
        sin_receta: [{ articulo_runfood_id: 105, descripcion: 'Postre Tres Leches', cantidad: '3.000' }],
        incompletos: [],
        con_opciones: []
      }
    });
  });

  it('al montar se hace una sola llamada a cobertura y ninguna a recetas', async () => {
    const onBack = vi.fn();
    render(<RunfoodRecipesView onBack={onBack} />);

    expect(screen.getByRole('heading', { level: 2, name: /recetas de runfood/i })).toBeInTheDocument();

    const backBtn = screen.getByRole('button', { name: 'Volver a Inventario' });
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText('Cobertura de ventas')).toBeInTheDocument();
    });

    expect(client.getRunfoodCoverage).toHaveBeenCalledTimes(1);
    expect(client.listRunfoodRecipes).not.toHaveBeenCalled();
  });

  it('permite alternar entre secciones con botones pastilla', async () => {
    render(<RunfoodRecipesView />);

    const ingrBtn = screen.getByRole('tab', { name: /ingredientes/i });
    const recBtn = screen.getByRole('tab', { name: /recetas/i });
    const consBtn = screen.getByRole('tab', { name: /consumo/i });

    fireEvent.click(ingrBtn);
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /pendientes/i })).toBeInTheDocument();
    });

    fireEvent.click(recBtn);
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Completas' })).toBeInTheDocument();
    });

    fireEvent.click(consBtn);
    await waitFor(() => {
      expect(screen.getByText('Consumo por ventas')).toBeInTheDocument();
    });
  });

  it('asociar en una receta abre ingredientes en pendientes con la búsqueda rellenada', async () => {
    render(<RunfoodRecipesView />);

    // Ir a Recetas
    const recBtn = screen.getByRole('tab', { name: /recetas/i });
    fireEvent.click(recBtn);

    await waitFor(() => {
      expect(screen.getByText('Lomo saltado')).toBeInTheDocument();
    });

    // Desplegar acordeón
    fireEvent.click(screen.getByRole('button', { name: /lomo saltado/i }));

    // Clic en Asociar del ingrediente no asociado
    const asociarBtn = screen.getByRole('button', { name: /asociar/i });
    fireEvent.click(asociarBtn);

    // Debe cambiar a la sección de ingredientes
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /pendientes/i })).toBeInTheDocument();
      const searchInput = screen.getByPlaceholderText(/buscar ingrediente de runfood o insumo/i);
      expect(searchInput).toHaveValue('Cebolla morada');
    });
  });

  it('desde consumo no descontado permite navegar a recetas con el buscador rellenado', async () => {
    render(<RunfoodRecipesView />);

    // Ir a Consumo
    const consBtn = screen.getByRole('tab', { name: /consumo/i });
    fireEvent.click(consBtn);

    await waitFor(() => {
      expect(screen.getByText(/No se descontó/i)).toBeInTheDocument();
    });

    // Desplegar bloque No se desconto
    fireEvent.click(screen.getByRole('button', { name: /No se descontó/i }));

    // Clic en Crear receta
    const createBtn = screen.getByRole('button', { name: 'Crear receta' });
    fireEvent.click(createBtn);

    // Debe cambiar a la sección de recetas
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Completas' })).toBeInTheDocument();
      const searchInput = screen.getByPlaceholderText(/buscar receta por nombre o código/i);
      expect(searchInput).toHaveValue('Postre Tres Leches');
    });
  });

  it('limpia mappingsSearch cuando el usuario cambia de sección a mano', async () => {
    render(<RunfoodRecipesView />);

    // Ir a Recetas
    fireEvent.click(screen.getByRole('tab', { name: /recetas/i }));
    await waitFor(() => expect(screen.getByText('Lomo saltado')).toBeInTheDocument());

    // Desplegar acordeón y navegar a ingredientes con búsqueda rellenada
    fireEvent.click(screen.getByRole('button', { name: /lomo saltado/i }));
    fireEvent.click(screen.getByRole('button', { name: /asociar/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/buscar ingrediente de runfood o insumo/i)).toHaveValue('Cebolla morada');
    });

    // Cambiar de sección a mano con el botón de la pestaña
    fireEvent.click(screen.getByRole('tab', { name: /ingredientes/i }));

    // La búsqueda debe haberse limpiado
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/buscar ingrediente de runfood o insumo/i)).toHaveValue('');
    });
  });
});
