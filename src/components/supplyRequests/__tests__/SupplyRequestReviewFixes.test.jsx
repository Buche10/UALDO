import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import SupplyRequestsView from '../SupplyRequestsView';
import EcosystemView from '../../EcosystemView';
import * as client from '../../../services/supplyRequestsClient';
import * as auth from '../../../services/auth';
import { pendingRequest } from '../../../hooks/__tests__/supplyRequestFixtures';

const pageOf = (data) => ({ ok: true, data: { data, meta: { current_page: 1, last_page: 1 } } });
const dialog = () => within(screen.getByRole('dialog'));

/**
 * Correcciones de la revisión del Brief 22p.
 */
describe('Brief 22p review fixes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, 'listRequests').mockResolvedValue(pageOf([pendingRequest]));
    vi.spyOn(client, 'getRequest').mockResolvedValue({ ok: true, data: { data: pendingRequest } });
  });

  it('M1: the same notification tapped again reopens and reloads the request', async () => {
    const onOpenConsumed = vi.fn();
    const { rerender } = render(<SupplyRequestsView isOwner={false} userId={12} openRequest={{ id: 101, nav: 1 }} onOpenConsumed={onOpenConsumed} />);
    await screen.findByText('Pedido de Rosa');
    expect(onOpenConsumed).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Volver a pedidos'));

    client.getRequest.mockResolvedValue({ ok: true, data: { data: { ...pendingRequest, status: 'rejected', decision_note: 'Hay stock' } } });
    rerender(<SupplyRequestsView isOwner={false} userId={12} openRequest={{ id: 101, nav: 2 }} onOpenConsumed={onOpenConsumed} />);
    await screen.findByText('Respuesta del dueño: Hay stock');
    expect(client.getRequest).toHaveBeenCalledTimes(2);
    expect(onOpenConsumed).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });

  it('M1: a notification for the request already open reloads it', async () => {
    const { rerender } = render(<SupplyRequestsView isOwner={false} userId={12} openRequest={{ id: 101, nav: 1 }} />);
    await screen.findByText('Pedido de Rosa');
    client.getRequest.mockResolvedValue({ ok: true, data: { data: { ...pendingRequest, status: 'rejected' } } });
    rerender(<SupplyRequestsView isOwner={false} userId={12} openRequest={{ id: 101, nav: 2 }} />);
    await waitFor(() => expect(screen.getByText(/Rechazado/)).toBeInTheDocument());
  });

  it('M2: Negocios tells the app that the notification params were used', async () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({ id: 12, role: 'staff', capabilities: { is_owner: false } });
    const onParamsConsumed = vi.fn();
    render(<EcosystemView subView="pedidos" onSubViewChange={vi.fn()} negociosParams={{ id: 101, nav: 3 }} onParamsConsumed={onParamsConsumed} />);
    await screen.findByText('Pedido de Rosa');
    expect(onParamsConsumed).toHaveBeenCalledTimes(1);
  });

  it('M4: the client_uuid survives switching tabs after a network error', async () => {
    const create = vi.spyOn(client, 'createRequest')
      .mockResolvedValueOnce({ ok: false, status: 0, isNetworkError: true })
      .mockResolvedValueOnce({ ok: true, status: 200, data: { data: pendingRequest } });
    vi.spyOn(client, 'getShoppingList').mockResolvedValue({ ok: true, data: { data: [] } });
    render(<SupplyRequestsView isOwner userId={1} />);
    fireEvent.click(await screen.findByText('Nuevo pedido'));
    fireEvent.click(screen.getByText('Agregar en texto libre'));
    fireEvent.change(screen.getByLabelText('Qué necesitas'), { target: { value: 'Esponjas' } });
    fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '2' } });
    fireEvent.click(screen.getByText('Enviar pedido'));
    await waitFor(() => expect(screen.getByText(/Sin conexión/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('tab', { name: 'Lista de compras' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Pedidos' }));
    fireEvent.click(screen.getByText('Enviar pedido'));
    await waitFor(() => expect(screen.getByText('Ya estaba enviado.')).toBeInTheDocument());
    expect(create.mock.calls[1][1]).toBe(create.mock.calls[0][1]);
  });

  it('L1 and L2: after a 409 the focus goes to the heading, and a failed reload is reported', async () => {
    vi.spyOn(client, 'decideRequest').mockResolvedValue({ ok: false, status: 409, data: { message: 'El pedido ya no está pendiente.' } });
    render(<SupplyRequestsView isOwner userId={1} />);
    fireEvent.click(await screen.findByText('Rosa, 2 insumos'));
    await screen.findByText('Pedido de Rosa');

    client.getRequest.mockResolvedValue({ ok: false, status: 0, error: 'Sin conexión' });
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));
    fireEvent.click(dialog().getByRole('button', { name: 'Aprobar' }));
    await waitFor(() => expect(screen.getByText('No se pudo cargar el estado actual: Sin conexión')).toBeInTheDocument());
    expect(screen.getByText('El pedido ya no está pendiente.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pedido de Rosa' })).toHaveFocus();
  });

  it('the owner cancels an approved request', async () => {
    const cancel = vi.spyOn(client, 'cancelRequest').mockResolvedValue({ ok: true, data: { data: { ...pendingRequest, status: 'cancelled' } } });
    client.getRequest.mockResolvedValue({ ok: true, data: { data: { ...pendingRequest, status: 'approved' } } });
    render(<SupplyRequestsView isOwner userId={1} openRequest={{ id: 101, nav: 1 }} />);
    await screen.findByText('Pedido de Rosa');
    expect(screen.getByRole('button', { name: 'Marcar comprado' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(dialog().getByRole('button', { name: 'Cancelar pedido' }));
    await waitFor(() => expect(screen.getByText('Pedido cancelado.')).toBeInTheDocument());
    expect(cancel).toHaveBeenCalledWith(101);
  });

  it('typing the reason never moves the focus to the button behind the dialog', async () => {
    render(<SupplyRequestsView isOwner userId={1} openRequest={{ id: 101, nav: 1 }} />);
    await screen.findByText('Pedido de Rosa');
    const trigger = screen.getByRole('button', { name: 'Rechazar' });
    const onFocus = vi.fn();
    trigger.addEventListener('focus', onFocus);
    fireEvent.click(trigger);

    const reason = screen.getByLabelText('Motivo del rechazo');
    fireEvent.change(reason, { target: { value: 'H' } });
    fireEvent.change(reason, { target: { value: 'Ha' } });
    fireEvent.change(reason, { target: { value: 'Hay stock' } });
    expect(onFocus).not.toHaveBeenCalled();
    expect(reason).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it('L7: a double tap in the dialog sends one request', async () => {
    let resolve;
    const spy = vi.spyOn(client, 'markPurchased').mockImplementation(() => new Promise((r) => { resolve = r; }));
    client.getRequest.mockResolvedValue({ ok: true, data: { data: { ...pendingRequest, status: 'approved' } } });
    render(<SupplyRequestsView isOwner userId={1} openRequest={{ id: 101, nav: 1 }} />);
    await screen.findByText('Pedido de Rosa');
    fireEvent.click(screen.getByRole('button', { name: 'Marcar comprado' }));
    const confirm = dialog().getByRole('button', { name: 'Marcar comprado' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'confirm-dialog-message');
    resolve({ ok: true, data: { data: { ...pendingRequest, status: 'purchased' } } });
    await waitFor(() => expect(screen.getByText('Pedido marcado como comprado.')).toBeInTheDocument());
  });
});
