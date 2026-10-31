import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RunfoodRecipesView from '../RunfoodRecipesView';
import * as client from '../../../services/runfoodCatalogClient';

describe('RunfoodRecipesView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, 'getRunfoodCoverage').mockResolvedValue({
      ok: true,
      data: {
        dias_analizados: 7,
        receta_completa: { porcentaje: '75.00' },
        stockeable_mapeado: { porcentaje: '15.00' },
        sin_receta_o_incompleto: { porcentaje: '10.00' }
      }
    });
    vi.spyOn(client, 'listRunfoodMappings').mockResolvedValue({
      ok: true,
      data: { data: [], meta: { total: 0 } }
    });
    vi.spyOn(client, 'listRunfoodRecipes').mockResolvedValue({
      ok: true,
      data: { data: [], meta: { total: 0 } }
    });
  });

  it('renderiza cabecera, selector de secciones y seccion inicial de cobertura', async () => {
    const onBack = vi.fn();
    render(<RunfoodRecipesView onBack={onBack} />);

    expect(screen.getByRole('heading', { level: 2, name: /recetas de runfood/i })).toBeInTheDocument();

    const backBtn = screen.getByRole('button', { name: 'Volver a Inventario' });
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText('Cobertura de ventas')).toBeInTheDocument();
    });
  });

  it('permite alternar entre secciones con botones pastilla', async () => {
    render(<RunfoodRecipesView />);

    const ingrBtn = screen.getByRole('tab', { name: /ingredientes/i });
    const recBtn = screen.getByRole('tab', { name: /recetas/i });

    fireEvent.click(ingrBtn);
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /pendientes/i })).toBeInTheDocument();
    });

    fireEvent.click(recBtn);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Completas' })).toBeInTheDocument();
    });
  });
});
