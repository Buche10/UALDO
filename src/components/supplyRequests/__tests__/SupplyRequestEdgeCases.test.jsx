import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SupplyRequestList from '../SupplyRequestList';
import SupplyRequestForm from '../SupplyRequestForm';
import ShoppingListPanel from '../ShoppingListPanel';
import SupplyRequestDetail from '../SupplyRequestDetail';
import { formatDateTime, itemsCount, quantityWithUnit, requesterName, statusLabel } from '../requestUi';
import * as client from '../../../services/supplyRequestsClient';
import { pendingRequest } from '../../../hooks/__tests__/supplyRequestFixtures';

const listOf = (overrides) => ({ items: [], loading: false, error: null, hasMore: false, loadMore: vi.fn(), reload: vi.fn(), ...overrides });

describe('requestUi', () => {
  it('formats engine values and missing data', () => {
    expect(statusLabel('purchased')).toBe('Comprado');
    expect(statusLabel('otro')).toBe('Sin dato');
    expect(requesterName({ requester: { name: '  Ana   María ' } })).toBe('Ana');
    expect(requesterName({})).toBe('Personal');
    expect(formatDateTime(null)).toBe('');
    expect(formatDateTime('no es fecha')).toBe('');
    expect(quantityWithUnit(null, 'kg')).toBe('Sin dato');
    expect(quantityWithUnit(2.5, '')).toBe('2,5');
    expect(itemsCount({ items: [{}] })).toBe('1 insumo');
    expect(itemsCount({})).toBe('0 insumos');
  });
});

describe('SupplyRequestList', () => {
  it('shows the error with retry, the empty messages and the loading states', () => {
    const reload = vi.fn();
    const props = { status: '', onStatusChange: vi.fn(), onOpen: vi.fn(), onNew: vi.fn() };
    const { rerender } = render(<SupplyRequestList list={listOf({ error: 'Error 500', reload })} isOwner {...props} />);
    fireEvent.click(screen.getByText('Reintentar'));
    expect(reload).toHaveBeenCalled();

    rerender(<SupplyRequestList list={listOf()} isOwner {...props} />);
    expect(screen.getByText('No hay pedidos con este filtro.')).toBeInTheDocument();
    rerender(<SupplyRequestList list={listOf()} isOwner={false} {...props} />);
    expect(screen.getByText('Todavía no tienes pedidos con este filtro.')).toBeInTheDocument();
    rerender(<SupplyRequestList list={listOf({ loading: true })} isOwner {...props} />);
    expect(screen.getByText('Cargando pedidos...')).toBeInTheDocument();

    const loadMore = vi.fn();
    rerender(<SupplyRequestList list={listOf({ items: [{ ...pendingRequest, priority: 'normal' }], loading: true, hasMore: true, loadMore })} isOwner {...props} />);
    expect(screen.queryByText('Urgente')).not.toBeInTheDocument();
    expect(screen.getByText('Cargando más...')).toBeInTheDocument();
    rerender(<SupplyRequestList list={listOf({ items: [pendingRequest], hasMore: true, loadMore })} isOwner {...props} />);
    fireEvent.click(screen.getByText('Cargar más'));
    expect(loadMore).toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'approved' } });
    expect(props.onStatusChange).toHaveBeenCalledWith('approved');
  });
});

describe('SupplyRequestForm', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('shows the general items error and the note error', async () => {
    vi.spyOn(client, 'createRequest').mockResolvedValue({ ok: false, status: 422, data: { message: 'Revisa los datos del pedido.', errors: { items: ['Agrega al menos un insumo.'], note: ['La nota admite hasta 500 caracteres.'] } } });
    render(<SupplyRequestForm onBack={vi.fn()} onCreated={vi.fn()} />);
    fireEvent.click(screen.getByText('Enviar pedido'));
    await waitFor(() => expect(screen.getByText('Agrega al menos un insumo.')).toBeInTheDocument());
    expect(screen.getByText('La nota admite hasta 500 caracteres.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'Urgente' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Urgente' }));
    expect(screen.getByRole('switch', { name: 'Urgente' })).not.toBeChecked();
  });
});

describe('ShoppingListPanel and SupplyRequestDetail errors', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('retries the shopping list and explains an empty one', async () => {
    vi.spyOn(client, 'getShoppingList')
      .mockResolvedValueOnce({ ok: false, status: 0, error: 'Sin conexión' })
      .mockResolvedValueOnce({ ok: true, data: { data: [] } });
    render(<ShoppingListPanel />);
    await waitFor(() => expect(screen.getByText('Sin conexión')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Reintentar'));
    await waitFor(() => expect(screen.getByText('No hay pedidos aprobados por comprar.')).toBeInTheDocument());
  });

  it('shows a detail loading error with retry and goes back', async () => {
    const onBack = vi.fn();
    vi.spyOn(client, 'getRequest')
      .mockResolvedValueOnce({ ok: false, status: 403 })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 0, error: 'Sin conexión' })
      .mockResolvedValueOnce({ ok: true, data: { data: { ...pendingRequest, priority: 'normal', note: null } } });

    // 403 y 404 no se arreglan reintentando: no se ofrece "Reintentar".
    const first = render(<SupplyRequestDetail requestId={101} isOwner={false} userId={12} onBack={onBack} />);
    await waitFor(() => expect(screen.getByText('Solo el dueño o quien hizo el pedido pueden verlo.')).toBeInTheDocument());
    expect(screen.queryByText('Reintentar')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Volver a pedidos'));
    expect(onBack).toHaveBeenCalled();
    first.unmount();
    const second = render(<SupplyRequestDetail requestId={101} isOwner={false} userId={12} onBack={onBack} />);
    await waitFor(() => expect(screen.getByText('El pedido no existe en este negocio.')).toBeInTheDocument());
    expect(screen.queryByText('Reintentar')).not.toBeInTheDocument();
    second.unmount();

    render(<SupplyRequestDetail requestId={101} isOwner={false} userId={12} onBack={onBack} />);
    await waitFor(() => expect(screen.getByText('Sin conexión')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Reintentar'));
    await screen.findByText('Pedido de Rosa');
    expect(screen.queryByText(/urgente/)).not.toBeInTheDocument();
  });
});

describe('SupplyRequestDetail dates (engine check)', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('shows each date the engine sent, without a double period after the time', async () => {
    const received = {
      ...pendingRequest,
      status: 'received',
      decided_at: '2026-10-10T15:00:00+00:00',
      purchased_at: '2026-10-11T09:15:00+00:00',
      received_at: '2026-10-11T12:40:00+00:00',
    };
    vi.spyOn(client, 'getRequest').mockResolvedValue({ ok: true, data: { data: received } });
    render(<SupplyRequestDetail requestId={101} isOwner userId={1} onBack={vi.fn()} />);
    await screen.findByText('Pedido de Rosa');

    expect(screen.getByText('Pedido').nextSibling).toHaveTextContent(formatDateTime(received.created_at));
    expect(screen.getByText('Decisión').nextSibling).toHaveTextContent(formatDateTime(received.decided_at));
    expect(screen.getByText('Comprado').nextSibling).toHaveTextContent(formatDateTime(received.purchased_at));
    expect(screen.getByText('Recibido').nextSibling).toHaveTextContent(formatDateTime(received.received_at));
    expect(document.body.textContent).not.toMatch(/\.\./);
  });

  it('leaves out the dates the request does not have yet', async () => {
    vi.spyOn(client, 'getRequest').mockResolvedValue({ ok: true, data: { data: pendingRequest } });
    render(<SupplyRequestDetail requestId={101} isOwner userId={1} onBack={vi.fn()} />);
    await screen.findByText('Pedido de Rosa');
    expect(screen.getByText('Pedido')).toBeInTheDocument();
    ['Decisión', 'Comprado', 'Recibido'].forEach((label) => expect(screen.queryByText(label)).not.toBeInTheDocument());
  });
});
