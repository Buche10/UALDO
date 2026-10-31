import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RunfoodMappingsPanel from '../RunfoodMappingsPanel';
import * as client from '../../../services/runfoodCatalogClient';
import * as inventoryClient from '../../../services/inventoryClient';

describe('RunfoodMappingsPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: {
        items: [{ id: 45, name: 'Lomo Fino', unit: 'kg', type: 'product' }]
      }
    });
  });

  it('muestra pestañas con contadores y lista de pendientes con sugerencia', async () => {
    vi.spyOn(client, 'listRunfoodMappings')
      .mockResolvedValueOnce({ ok: true, data: { meta: { total: 3 } } })
      .mockResolvedValueOnce({ ok: true, data: { meta: { total: 8 } } })
      .mockResolvedValueOnce({ ok: true, data: { meta: { total: 1 } } })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          data: [
            {
              id: 1,
              runfood_article: { id: 10, descripcion: 'Lomo fino kg', codigo: 'I01' },
              suggested_inventory_item: { id: 45, name: 'Lomo Fino', unit: 'kg' },
              suggestion_score: 95,
              recipes_count: 2,
              status: 'pending'
            }
          ],
          meta: { current_page: 1, last_page: 1 }
        }
      });

    render(<RunfoodMappingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Pendientes')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Confirmados')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Lomo fino kg')).toBeInTheDocument();
      expect(screen.getByText(/Coincidencia alta/)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Elegir otro insumo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ignorar' })).toBeInTheDocument();
  });

  it('permite aceptar sugerencia y muestra mensaje de éxito', async () => {
    vi.spyOn(client, 'listRunfoodMappings').mockResolvedValue({
      ok: true,
      data: {
        data: [
          {
            id: 2,
            runfood_article: { descripcion: 'Pollo trozado' },
            suggested_inventory_item: { id: 50, name: 'Pechuga Pollo', unit: 'kg' },
            suggestion_score: 80,
            status: 'pending'
          }
        ],
        meta: {}
      }
    });
    vi.spyOn(client, 'acceptRunfoodMappingSuggestion').mockResolvedValueOnce({ ok: true, data: {} });

    render(<RunfoodMappingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Pollo trozado')).toBeInTheDocument();
    });

    const acceptBtn = screen.getByRole('button', { name: 'Aceptar' });
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(client.acceptRunfoodMappingSuggestion).toHaveBeenCalledWith(2);
      expect(screen.getByText('Sugerencia aceptada exitosamente.')).toBeInTheDocument();
    });
  });

  it('requiere confirmación en dos pasos para ignorar', async () => {
    vi.spyOn(client, 'listRunfoodMappings').mockResolvedValue({
      ok: true,
      data: {
        data: [
          {
            id: 5,
            runfood_article: { descripcion: 'Hielo bolsa' },
            status: 'pending'
          }
        ],
        meta: {}
      }
    });
    vi.spyOn(client, 'ignoreRunfoodMapping').mockResolvedValueOnce({ ok: true });

    render(<RunfoodMappingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Hielo bolsa')).toBeInTheDocument();
    });

    const ignoreBtn = screen.getByRole('button', { name: 'Ignorar' });
    fireEvent.click(ignoreBtn);

    // Aparece el aviso de confirmacion
    expect(screen.getByText(/No se descontará del inventario\. ¿Confirmar que deseas ignorarlo\?/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: 'Sí, ignorar' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(client.ignoreRunfoodMapping).toHaveBeenCalledWith(5);
      expect(screen.getByText('Ingrediente ignorado. No se descontará del inventario.')).toBeInTheDocument();
    });
  });

  it('permite abrir modal para elegir otro insumo y factor', async () => {
    vi.spyOn(client, 'listRunfoodMappings').mockResolvedValue({
      ok: true,
      data: {
        data: [
          {
            id: 8,
            runfood_article: { descripcion: 'Aceite vegetal' },
            status: 'pending'
          }
        ],
        meta: {}
      }
    });
    vi.spyOn(client, 'updateRunfoodMapping').mockResolvedValueOnce({ ok: true, data: {} });

    render(<RunfoodMappingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Aceite vegetal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Elegir otro insumo' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Asociar a insumo')).toBeInTheDocument();
  });

  it('permite cambiar a pestaña Ignorados y reabrir un ingrediente', async () => {
    vi.spyOn(client, 'listRunfoodMappings').mockResolvedValue({
      ok: true,
      data: {
        data: [
          {
            id: 20,
            runfood_article: { descripcion: 'Servilletas' },
            status: 'ignored'
          }
        ],
        meta: {}
      }
    });
    vi.spyOn(client, 'reopenRunfoodMapping').mockResolvedValueOnce({ ok: true, data: {} });

    render(<RunfoodMappingsPanel />);

    const ignoredTab = screen.getByRole('tab', { name: /Ignorados/i });
    fireEvent.click(ignoredTab);

    await waitFor(() => {
      expect(screen.getByText('Servilletas')).toBeInTheDocument();
    });

    const reopenBtn = screen.getByRole('button', { name: 'Reabrir' });
    fireEvent.click(reopenBtn);

    await waitFor(() => {
      expect(client.reopenRunfoodMapping).toHaveBeenCalledWith(20);
      expect(screen.getByText('Ingrediente reabierto a pendiente.')).toBeInTheDocument();
    });
  });
});
