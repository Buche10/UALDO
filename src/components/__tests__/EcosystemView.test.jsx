import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EcosystemView from '../EcosystemView';
import * as auth from '../../services/auth';
import * as client from '../../services/supplyRequestsClient';
import { pendingRequest } from '../../hooks/__tests__/supplyRequestFixtures';
import { ABILITIES, ROLES } from '../../services/permissions';

const pageOf = (data) => ({ ok: true, data: { data, meta: { current_page: 1, last_page: 1 } } });

describe('EcosystemView (Brief 22p / 30p / 35p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, 'listRequests').mockResolvedValue(pageOf([pendingRequest]));
    vi.spyOn(client, 'getRequest').mockResolvedValue({ ok: true, data: { data: pendingRequest } });
  });

  it('shows the Pedidos module card to any member and changes the subview', () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({ id: 12, role: 'staff', capabilities: { is_owner: false } });
    const onSubViewChange = vi.fn();
    render(<EcosystemView subView="overview" onSubViewChange={onSubViewChange} />);

    const card = screen.getByRole('button', { name: /Pedidos:/i });
    expect(card).toBeInTheDocument();
    fireEvent.click(card);
    expect(onSubViewChange).toHaveBeenCalledWith('pedidos');
  });

  it('staff sees "Mis pedidos" and decider/owner "Pedidos internos"', async () => {
    const getUser = vi.spyOn(auth, 'getUser').mockReturnValue({ id: 12, role: 'staff', capabilities: { is_owner: false } });
    const { unmount } = render(<EcosystemView subView="pedidos" onSubViewChange={vi.fn()} />);
    expect(screen.getByText('Mis pedidos')).toBeInTheDocument();
    await waitFor(() => expect(client.listRequests).toHaveBeenCalledWith({ status: '', page: 1 }));
    unmount();

    getUser.mockReturnValue({
      id: 1,
      role: 'owner',
      capabilities: { abilities: [ABILITIES.SUPPLY_DECIDE, ABILITIES.SUPPLY_REQUEST] },
    });
    render(<EcosystemView subView="pedidos" onSubViewChange={vi.fn()} />);
    expect(screen.getByText('Pedidos internos')).toBeInTheDocument();
    await waitFor(() => expect(client.listRequests).toHaveBeenLastCalledWith({ status: 'pending', page: 1 }));
  });

  it('a notification with the request id opens its detail', async () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({
      id: 1,
      role: 'owner',
      capabilities: { abilities: [ABILITIES.SUPPLY_DECIDE, ABILITIES.SUPPLY_REQUEST] },
    });
    render(<EcosystemView subView="pedidos" onSubViewChange={vi.fn()} negociosParams={{ id: 101 }} />);
    await screen.findByText('Pedido de Rosa');
    expect(client.getRequest).toHaveBeenCalledWith(101);
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeInTheDocument();
  });

  describe('Ventas module permissions (Brief 23p / 30p)', () => {
    it('owner or admin sees the Ventas module card and can switch to it', () => {
      vi.spyOn(auth, 'getUser').mockReturnValue({
        id: 1,
        role: 'owner',
        capabilities: { abilities: [ABILITIES.SALES_TOTALS] },
      });
      const onSubViewChange = vi.fn();
      render(<EcosystemView subView="overview" onSubViewChange={onSubViewChange} />);

      const ventasCard = screen.getByRole('button', { name: /Ventas:/i });
      expect(ventasCard).toBeInTheDocument();
      fireEvent.click(ventasCard);
      expect(onSubViewChange).toHaveBeenCalledWith('ventas');
    });

    it('staff without sales.totals does NOT see the Ventas card in overview', () => {
      vi.spyOn(auth, 'getUser').mockReturnValue({ id: 2, role: 'staff', capabilities: { is_owner: false } });
      render(<EcosystemView subView="overview" onSubViewChange={vi.fn()} />);

      expect(screen.queryByRole('button', { name: /Ventas:/i })).not.toBeInTheDocument();
    });

    it('shows "Acceso restringido" if member lands on subView="ventas" without permission', () => {
      vi.spyOn(auth, 'getUser').mockReturnValue({ id: 2, role: 'staff', capabilities: { is_owner: false } });
      render(<EcosystemView subView="ventas" onSubViewChange={vi.fn()} />);

      expect(screen.getByText('Acceso restringido')).toBeInTheDocument();
      expect(screen.getByText(/Esta sección le corresponde a dueño o administración/i)).toBeInTheDocument();
    });

    it('shows "Acceso restringido" if lounge_staff lands on subView="cashclose"', () => {
      vi.spyOn(auth, 'getUser').mockReturnValue({
        id: 30,
        role: ROLES.LOUNGE_STAFF,
        capabilities: { abilities: [ABILITIES.INVENTORY_VIEW] },
      });
      const onSubViewChange = vi.fn();
      render(<EcosystemView subView="cashclose" onSubViewChange={onSubViewChange} />);

      expect(screen.getByText('Acceso restringido')).toBeInTheDocument();
      expect(screen.getByText(/Esta sección le corresponde a administración o dueño/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Volver a módulos' }));
      expect(onSubViewChange).toHaveBeenCalledWith('overview');
    });

    it('shows "Acceso restringido" if lounge_head lands on subView="cashclose" (Brief 35p)', () => {
      vi.spyOn(auth, 'getUser').mockReturnValue({
        id: 25,
        role: ROLES.LOUNGE_HEAD,
        capabilities: { abilities: [ABILITIES.CASH_REGISTER] },
      });
      render(<EcosystemView subView="cashclose" onSubViewChange={vi.fn()} />);

      expect(screen.getByText('Acceso restringido')).toBeInTheDocument();
      expect(screen.getByText(/Esta sección le corresponde a administración o dueño/i)).toBeInTheDocument();
    });

    it('renders CashDeclarationView on subView="cash_declaration" for lounge_head (Brief 35p)', () => {
      vi.spyOn(auth, 'getUser').mockReturnValue({
        id: 25,
        role: ROLES.LOUNGE_HEAD,
        capabilities: { abilities: [ABILITIES.CASH_REGISTER] },
      });
      render(<EcosystemView subView="cash_declaration" onSubViewChange={vi.fn()} />);
      expect(screen.getByText('Mi cierre de caja')).toBeInTheDocument();
    });

    it('renders DailyCloseView on subView="daily_close" for authorized user', () => {
      vi.spyOn(auth, 'getUser').mockReturnValue({
        id: 1,
        role: 'owner',
        capabilities: { abilities: [ABILITIES.INVENTORY_COUNT_KITCHEN] },
      });
      render(<EcosystemView subView="daily_close" onSubViewChange={vi.fn()} />);
      expect(screen.getByText('Cierre del día')).toBeInTheDocument();
    });
  });
});
