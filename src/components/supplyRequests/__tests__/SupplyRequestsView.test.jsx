import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import SupplyRequestsView from '../SupplyRequestsView';
import * as client from '../../../services/supplyRequestsClient';
import * as inventoryClient from '../../../services/inventoryClient';
import { catalogItems, pendingRequest, shoppingList } from '../../../hooks/__tests__/supplyRequestFixtures';

const pageOf = (data, current = 1, last = 1) => ({ ok: true, data: { data, meta: { current_page: current, last_page: last } } });
const dialog = () => within(screen.getByRole('dialog'));

describe('SupplyRequestsView for staff', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, 'listRequests').mockResolvedValue(pageOf([pendingRequest]));
    vi.spyOn(client, 'getRequest').mockResolvedValue({ ok: true, data: { data: pendingRequest } });
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({ ok: true, data: { items: catalogItems } });
  });

  it('creates a request with a catalog item and a free text item', async () => {
    const create = vi.spyOn(client, 'createRequest').mockResolvedValue({ ok: true, status: 201, data: { data: pendingRequest } });
    render(<SupplyRequestsView isOwner={false} userId={12} />);
    expect(screen.getByText('Mis pedidos')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Lista de compras' })).not.toBeInTheDocument();
    await waitFor(() => expect(client.listRequests).toHaveBeenCalledWith({ status: '', page: 1 }));

    fireEvent.click(screen.getByText('Nuevo pedido'));
    fireEvent.click(screen.getByRole('switch', { name: 'Urgente' }));
    fireEvent.change(screen.getByLabelText('Buscar en el catálogo'), { target: { value: 'ace' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Aceite Vegetal (ACE-1)' })).toBeInTheDocument());
    expect(screen.queryByText('Lavado de manteles')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aceite Vegetal (ACE-1)' }));
    expect(screen.getAllByLabelText('Cantidad')[0]).toHaveFocus();
    fireEvent.change(screen.getAllByLabelText('Cantidad')[0], { target: { value: '5' } });
    expect(screen.getByLabelText('Unidad')).toBeDisabled();

    fireEvent.click(screen.getByText('Agregar en texto libre'));
    expect(screen.getByLabelText('Qué necesitas')).toHaveFocus();
    fireEvent.change(screen.getByLabelText('Qué necesitas'), { target: { value: 'Esponjas verdes' } });
    fireEvent.change(screen.getAllByLabelText('Cantidad')[1], { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Nota para el dueño (opcional)'), { target: { value: 'Para la noche' } });
    fireEvent.click(screen.getByText('Enviar pedido'));

    await waitFor(() => expect(screen.getByText('Pedido enviado. El dueño recibe el aviso en la app.')).toBeInTheDocument());
    expect(create.mock.calls[0][0]).toEqual({
      priority: 'urgent',
      note: 'Para la noche',
      items: [
        { inventory_item_id: 42, quantity: '5', note: '' },
        { free_text_name: 'Esponjas verdes', unit: 'unidad', quantity: '10', note: '' },
      ],
    });
    expect(await screen.findByText('Pedido de Rosa')).toBeInTheDocument();
  });

  it('shows 422 errors next to the item and the search states', async () => {
    vi.spyOn(client, 'createRequest').mockResolvedValue({ ok: false, status: 422, data: { message: 'Revisa los datos del pedido.', errors: { 'items.0.unit': ['Indica la unidad (hasta 20 caracteres).'] } } });
    render(<SupplyRequestsView isOwner={false} userId={12} />);
    fireEvent.click(await screen.findByText('Nuevo pedido'));

    inventoryClient.listInventory.mockResolvedValueOnce({ ok: false, status: 0 });
    fireEvent.change(screen.getByLabelText('Buscar en el catálogo'), { target: { value: 'pan' } });
    await waitFor(() => expect(screen.getByText('No se pudo buscar: revisa la conexión.')).toBeInTheDocument());
    inventoryClient.listInventory.mockResolvedValueOnce({ ok: true, data: { items: [] } });
    fireEvent.change(screen.getByLabelText('Buscar en el catálogo'), { target: { value: 'xyz' } });
    await waitFor(() => expect(screen.getByText(/Sin resultados para "xyz"/)).toBeInTheDocument());

    fireEvent.click(screen.getByText('Agregar en texto libre'));
    fireEvent.change(screen.getByLabelText('Unidad'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Enviar pedido'));
    await waitFor(() => expect(screen.getByText('Indica la unidad (hasta 20 caracteres).')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Quitar Insumo en texto libre'));
    expect(screen.getByText('Todavía no hay insumos en el pedido.')).toBeInTheDocument();
  });

  it('the requester cancels a pending request but cannot decide it', async () => {
    vi.spyOn(client, 'cancelRequest').mockResolvedValue({ ok: true, data: { data: { ...pendingRequest, status: 'cancelled' } } });
    render(<SupplyRequestsView isOwner={false} userId={12} />);
    fireEvent.click(await screen.findByText('Rosa, 2 insumos'));
    await screen.findByText('Pedido de Rosa');
    expect(screen.getByText('Aceite Vegetal')).toBeInTheDocument();
    expect(screen.getByText('Esponjas verdes (texto libre)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(dialog().getByRole('button', { name: 'Cancelar pedido' }));
    await waitFor(() => expect(screen.getByText('Pedido cancelado.')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pedido de Rosa' })).toHaveFocus();
  });

  it('another member sees no actions on a request that is not theirs', async () => {
    render(<SupplyRequestsView isOwner={false} userId={99} />);
    fireEvent.click(await screen.findByText('Rosa, 2 insumos'));
    await screen.findByText('Pedido de Rosa');
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });

  it('shows names and notes as plain text', async () => {
    const xss = '<img src=x onerror=alert(1)>';
    const evil = { ...pendingRequest, note: xss, requester: { id: 12, name: xss }, items: [{ ...pendingRequest.items[0], name: xss }] };
    client.listRequests.mockResolvedValue(pageOf([evil]));
    client.getRequest.mockResolvedValue({ ok: true, data: { data: evil } });
    const { container } = render(<SupplyRequestsView isOwner={false} userId={12} />);
    // La lista muestra solo el primer nombre del solicitante.
    fireEvent.click(await screen.findByText(/, 1 insumo$/));
    await waitFor(() => expect(screen.getAllByText((text) => text.includes(xss)).length).toBeGreaterThan(1));
    expect(container.querySelector('img')).toBeNull();
  });
});

describe('SupplyRequestsView for the owner', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, 'listRequests').mockResolvedValue(pageOf([pendingRequest]));
    vi.spyOn(client, 'getRequest').mockResolvedValue({ ok: true, data: { data: pendingRequest } });
  });

  async function openPending() {
    render(<SupplyRequestsView isOwner userId={1} />);
    await waitFor(() => expect(client.listRequests).toHaveBeenCalledWith({ status: 'pending', page: 1 }));
    fireEvent.click(await screen.findByText('Rosa, 2 insumos'));
    await screen.findByText('Pedido de Rosa');
  }

  it('rejects with a required reason in the dialog', async () => {
    vi.spyOn(client, 'decideRequest')
      .mockResolvedValueOnce({ ok: false, status: 422, data: { errors: { note: ['Indica el motivo del rechazo.'] } } })
      .mockResolvedValueOnce({ ok: true, data: { data: { ...pendingRequest, status: 'rejected', decision_note: 'Hay stock en bodega' } } });
    await openPending();

    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));
    expect(screen.getByLabelText('Motivo del rechazo')).toHaveFocus();
    fireEvent.click(dialog().getByRole('button', { name: 'Rechazar' }));
    await waitFor(() => expect(dialog().getByText('Indica el motivo del rechazo.')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Motivo del rechazo'), { target: { value: 'Hay stock en bodega' } });
    expect(screen.getByLabelText('Motivo del rechazo')).toHaveFocus();
    fireEvent.click(dialog().getByRole('button', { name: 'Rechazar' }));
    await waitFor(() => expect(screen.getByText('Pedido rechazado.')).toBeInTheDocument());
    expect(client.decideRequest).toHaveBeenLastCalledWith(101, 'rejected', 'Hay stock en bodega');
    expect(screen.getByText('Respuesta del dueño: Hay stock en bodega')).toBeInTheDocument();
  });

  it('approves, marks purchased and received', async () => {
    vi.spyOn(client, 'decideRequest').mockResolvedValue({ ok: true, data: { data: { ...pendingRequest, status: 'approved' } } });
    vi.spyOn(client, 'markPurchased').mockResolvedValue({ ok: true, data: { data: { ...pendingRequest, status: 'purchased' } } });
    vi.spyOn(client, 'markReceived').mockResolvedValue({ ok: true, data: { data: { ...pendingRequest, status: 'received' } } });
    await openPending();

    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));
    fireEvent.click(dialog().getByRole('button', { name: 'Aprobar' }));
    await waitFor(() => expect(screen.getByText('Pedido aprobado.')).toBeInTheDocument());
    expect(client.decideRequest).toHaveBeenCalledWith(101, 'approved', '');

    fireEvent.click(screen.getByRole('button', { name: 'Marcar comprado' }));
    fireEvent.click(dialog().getByRole('button', { name: 'Marcar comprado' }));
    await waitFor(() => expect(screen.getByText('Pedido marcado como comprado.')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Marcar recibido' }));
    fireEvent.click(dialog().getByRole('button', { name: 'Marcar recibido' }));
    await waitFor(() => expect(screen.getByText('Pedido marcado como recibido.')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Marcar|Aprobar|Cancelar/ })).not.toBeInTheDocument();

    // Volver a "Pendientes": el pedido recibido ya no está en ese filtro.
    fireEvent.click(screen.getByText('Volver a pedidos'));
    expect(screen.queryByText('Rosa, 2 insumos')).not.toBeInTheDocument();
  });

  it('after a 409 it reloads the real state and explains the reason', async () => {
    vi.spyOn(client, 'decideRequest').mockResolvedValue({ ok: false, status: 409, data: { message: "No es posible cambiar el estado del pedido de 'cancelled' a 'approved'." } });
    await openPending();
    client.getRequest.mockResolvedValue({ ok: true, data: { data: { ...pendingRequest, status: 'cancelled' } } });

    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));
    fireEvent.click(dialog().getByRole('button', { name: 'Aprobar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Cancelado./)).toBeInTheDocument());
    expect(screen.getByText("No es posible cambiar el estado del pedido de 'cancelled' a 'approved'.")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Volver a pedidos'));
    expect(screen.queryByText('Rosa, 2 insumos')).not.toBeInTheDocument();
  });

  it('shows the consolidated shopping list and keeps a request form when switching tabs', async () => {
    vi.spyOn(client, 'getShoppingList').mockResolvedValue({ ok: true, data: { data: shoppingList } });
    render(<SupplyRequestsView isOwner userId={1} />);
    expect(screen.getByText('Pedidos internos')).toBeInTheDocument();
    fireEvent.click(await screen.findByText('Nuevo pedido'));
    fireEvent.change(screen.getByLabelText('Nota para el dueño (opcional)'), { target: { value: 'Reposición' } });

    fireEvent.click(screen.getByRole('tab', { name: 'Lista de compras' }));
    await waitFor(() => expect(screen.getByText('Aceite Vegetal (urgente)')).toBeInTheDocument());
    expect(screen.getByText('Stock 2 litro, mínimo 5 litro. 2 pedidos.')).toBeInTheDocument();
    expect(screen.getByText('Fuera del catálogo. 1 pedido.')).toBeInTheDocument();
    expect(screen.getByText('20 paquete')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Pedidos' }));
    expect(screen.getByLabelText('Nota para el dueño (opcional)')).toHaveValue('Reposición');
  });

  it('opens the request of a notification', async () => {
    render(<SupplyRequestsView isOwner userId={1} openRequest={{ id: 101, nav: 1 }} />);
    await screen.findByText('Pedido de Rosa');
    expect(client.getRequest).toHaveBeenCalledWith(101);
  });
});
