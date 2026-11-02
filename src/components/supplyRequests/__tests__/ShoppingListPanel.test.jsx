import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShoppingListPanel from '../ShoppingListPanel';
import * as client from '../../../services/supplyRequestsClient';

describe('ShoppingListPanel (Brief 26p)', () => {
  const mockOverview = {
    aprobado: [
      {
        inventory_item_id: 15,
        name: 'Aceite Vegetal',
        quantity: 10,
        unit: 'litro',
        stock: 2,
        min_stock: 5,
        requests_count: 2,
        requests_without_quantity: 1,
        has_urgent: true,
      },
      {
        inventory_item_id: null,
        name: 'Servilletas',
        quantity: null,
        unit: 'paquete',
        stock: null,
        min_stock: null,
        requests_count: 1,
        requests_without_quantity: 0,
        has_urgent: false,
      },
    ],
    por_aprobar: [
      {
        id: 101,
        requester_first_name: 'Ana',
        created_at: new Date().toISOString(),
        priority: 'urgent',
        note: 'Falta para la noche',
        items: [{ id: 1, name: 'Tomates', quantity: null, unit: 'kg' }],
      },
      {
        id: 102,
        requester_first_name: 'Carlos',
        created_at: new Date().toISOString(),
        priority: 'normal',
        note: null,
        items: [{ id: 2, name: 'Cebolla', quantity: '5.000', unit: 'kg' }],
      },
    ],
    bajo_minimo: [
      {
        name: 'Arroz',
        stock: '1.000',
        min_stock: '10.000',
        unit: 'kg',
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, 'getPurchasingOverview').mockResolvedValue({
      ok: true,
      data: { data: mockOverview },
    });
  });

  it('muestra los tres bloques de compras con sus datos', async () => {
    render(<ShoppingListPanel />);

    await waitFor(() => {
      expect(screen.getByText('Compras aprobadas')).toBeInTheDocument();
      expect(screen.getByText('Por aprobar')).toBeInTheDocument();
      expect(screen.getByText('Bajo mínimo sin pedir')).toBeInTheDocument();
    });

    // Bloque Aprobado
    expect(screen.getByText(/Aceite Vegetal/)).toBeInTheDocument();
    expect(screen.getByText(/1 pedido sin cantidad/)).toBeInTheDocument();
    expect(screen.getByText('Servilletas')).toBeInTheDocument();
    expect(screen.getAllByText('Cantidad por definir').length).toBeGreaterThanOrEqual(1);

    // Bloque Por aprobar
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Carlos')).toBeInTheDocument();
    expect(screen.getByText('Tomates')).toBeInTheDocument();

    // Bloque Bajo mínimo
    expect(screen.getByText('Arroz')).toBeInTheDocument();
    expect(screen.getByText(/Stock actual: 1 kg/)).toBeInTheDocument();
  });

  it('permite aprobar un pedido individualmente', async () => {
    const decideSpy = vi.spyOn(client, 'decideRequest').mockResolvedValue({
      ok: true,
      data: { data: { id: 101, status: 'approved' } },
    });

    render(<ShoppingListPanel />);

    await waitFor(() => {
      expect(screen.getByText('Ana')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByRole('button', { name: 'Aprobar' });
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(decideSpy).toHaveBeenCalledWith(101, 'approved');
    });
  });

  it('permite ver el detalle de un pedido por aprobar', async () => {
    const onView = vi.fn();
    render(<ShoppingListPanel onViewRequest={onView} />);

    await waitFor(() => {
      expect(screen.getByText('Ana')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByRole('button', { name: /ver/i });
    fireEvent.click(viewButtons[0]);

    expect(onView).toHaveBeenCalledWith(101);
  });

  it('"Aprobar todos" pide confirmación en dos pasos y reporta éxitos y fallos parciales', async () => {
    const decideSpy = vi.spyOn(client, 'decideRequest')
      .mockResolvedValueOnce({ ok: true, data: {} }) // 101 exito
      .mockResolvedValueOnce({ ok: false, error: 'Error interno' }); // 102 fallo

    render(<ShoppingListPanel />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Aprobar todos' })).toBeInTheDocument();
    });

    // Paso 1: clic en Aprobar todos
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar todos' }));

    expect(screen.getByText('Se aprobarán 2 pedidos.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar aprobación' })).toBeInTheDocument();
    expect(decideSpy).not.toHaveBeenCalled();

    // Paso 2: confirmar
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar aprobación' }));

    await waitFor(() => {
      expect(decideSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('status')).toHaveTextContent(/Se aprobaron 1 de 2 pedidos/i);
      expect(screen.getByRole('status')).toHaveTextContent(/1 con fallo/i);
    });
  });

  it('muestra estados vacíos cuando las listas están vacías', async () => {
    vi.spyOn(client, 'getPurchasingOverview').mockResolvedValue({
      ok: true,
      data: { data: { aprobado: [], por_aprobar: [], bajo_minimo: [] } },
    });

    render(<ShoppingListPanel />);

    await waitFor(() => {
      expect(screen.getByText('Nada por aprobar.')).toBeInTheDocument();
      expect(screen.getByText('No hay pedidos aprobados por comprar.')).toBeInTheDocument();
      expect(screen.getByText('Ningún insumo bajo mínimo.')).toBeInTheDocument();
    });
  });

  it('muestra el bloque informativo "Por reservas" cuando llega comprometido_por_reservas (Brief 39p)', async () => {
    vi.spyOn(client, 'getPurchasingOverview').mockResolvedValue({
      ok: true,
      data: {
        data: {
          aprobado: [],
          por_aprobar: [],
          bajo_minimo: [],
          comprometido_por_reservas: [
            { item_id: 7, name: 'Bife', unit: 'kg', stock: '20.000', committed: '15.000', available: '5.000', min: '8.000', suggested: '3.000' },
          ],
        },
      },
    });

    render(<ShoppingListPanel />);

    await waitFor(() => expect(screen.getByText('Por reservas')).toBeInTheDocument());
    expect(screen.getByText('Bife')).toBeInTheDocument();
    expect(screen.getByText(/Disponible: 5 kg/)).toBeInTheDocument();
    expect(screen.getByText(/Mínimo: 8 kg/)).toBeInTheDocument();
    expect(screen.getByText(/Sugerencia: 3 kg/)).toBeInTheDocument();
    expect(screen.getByText(/Solo informativo: no crea pedidos ni compras/)).toBeInTheDocument();
  });

  it('muestra mensaje de error con botón de reintentar si falla la carga', async () => {
    vi.spyOn(client, 'getPurchasingOverview').mockResolvedValueOnce({
      ok: false,
      error: 'Error de conexión con el motor',
    });

    render(<ShoppingListPanel />);

    await waitFor(() => {
      expect(screen.getByText('Error de conexión con el motor')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: 'Reintentar' });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(client.getPurchasingOverview).toHaveBeenCalledTimes(2);
    });
  });
});
