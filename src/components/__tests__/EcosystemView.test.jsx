import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EcosystemView from '../EcosystemView';
import * as auth from '../../services/auth';
import * as client from '../../services/supplyRequestsClient';
import { pendingRequest } from '../../hooks/__tests__/supplyRequestFixtures';

const pageOf = (data) => ({ ok: true, data: { data, meta: { current_page: 1, last_page: 1 } } });

describe('EcosystemView (Brief 22p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, 'listRequests').mockResolvedValue(pageOf([pendingRequest]));
    vi.spyOn(client, 'getRequest').mockResolvedValue({ ok: true, data: { data: pendingRequest } });
  });

  it('shows the Pedidos tab to any member and changes the subview', () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({ id: 12, role: 'staff', capabilities: { is_owner: false } });
    const onSubViewChange = vi.fn();
    render(<EcosystemView subView="overview" onSubViewChange={onSubViewChange} />);

    const tab = screen.getByRole('button', { name: 'Pedidos' });
    expect(tab).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(tab);
    expect(onSubViewChange).toHaveBeenCalledWith('pedidos');
    expect(screen.getByRole('button', { name: 'Caja & POS' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('staff sees "Mis pedidos" and the owner "Pedidos internos"', async () => {
    const getUser = vi.spyOn(auth, 'getUser').mockReturnValue({ id: 12, role: 'staff', capabilities: { is_owner: false } });
    const { unmount } = render(<EcosystemView subView="pedidos" onSubViewChange={vi.fn()} />);
    expect(screen.getByText('Mis pedidos')).toBeInTheDocument();
    await waitFor(() => expect(client.listRequests).toHaveBeenCalledWith({ status: '', page: 1 }));
    unmount();

    getUser.mockReturnValue({ id: 1, role: 'owner', capabilities: { is_owner: true } });
    render(<EcosystemView subView="pedidos" onSubViewChange={vi.fn()} />);
    expect(screen.getByText('Pedidos internos')).toBeInTheDocument();
    await waitFor(() => expect(client.listRequests).toHaveBeenLastCalledWith({ status: 'pending', page: 1 }));
  });

  it('a notification with the request id opens its detail', async () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({ id: 1, role: 'owner', capabilities: { is_owner: true } });
    render(<EcosystemView subView="pedidos" onSubViewChange={vi.fn()} negociosParams={{ id: 101 }} />);
    await screen.findByText('Pedido de Rosa');
    expect(client.getRequest).toHaveBeenCalledWith(101);
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeInTheDocument();
  });
});
