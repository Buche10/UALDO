import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModuleGrid from '../ModuleGrid';
import { ABILITIES, ROLES } from '../../../services/permissions';
import * as withdrawalsClient from '../../../services/withdrawalsClient';
import * as reservationsClient from '../../../services/reservationsClient';

describe('ModuleGrid component (Brief 30p & 32p_fix & 35p & 36p & 38p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('un lounge_staff no ve Ventas ni Cierre de caja, pero sí ve Inventario y Pedidos', () => {
    const loungeStaffUser = {
      id: 20,
      capabilities: {
        role: ROLES.LOUNGE_STAFF,
        abilities: [
          ABILITIES.SUPPLY_REQUEST,
          ABILITIES.INVENTORY_VIEW,
          ABILITIES.INVENTORY_MOVE,
          ABILITIES.INVENTORY_COUNT_LOUNGE,
          ABILITIES.WITHDRAWALS_DECLARE,
        ],
      },
    };

    render(<ModuleGrid user={loungeStaffUser} onSelectModule={vi.fn()} />);

    expect(screen.getByText('Inventario')).toBeInTheDocument();
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(screen.queryByText('Ventas')).not.toBeInTheDocument();
    expect(screen.queryByText('Cierre de caja')).not.toBeInTheDocument();
  });

  it('un lounge_head ve "Mi cierre de caja" (por cash.register sin cash.review), pero no la tarjeta completa ni Ventas (Brief 35p)', () => {
    const loungeHeadUser = {
      id: 21,
      capabilities: {
        role: ROLES.LOUNGE_HEAD,
        abilities: [
          ABILITIES.SUPPLY_REQUEST,
          ABILITIES.INVENTORY_VIEW,
          ABILITIES.CASH_REGISTER,
        ],
      },
    };
    const onSelect = vi.fn();

    render(<ModuleGrid user={loungeHeadUser} onSelectModule={onSelect} />);

    expect(screen.getByText('Inventario')).toBeInTheDocument();
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Mi cierre de caja')).toBeInTheDocument();
    expect(screen.queryByText('Cierre de caja')).not.toBeInTheDocument();
    expect(screen.queryByText('Ventas')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Mi cierre de caja:/i }));
    expect(onSelect).toHaveBeenCalledWith('cash_declaration');
  });

  it('un dueño (owner) ve todos los módulos registrados', () => {
    const ownerUser = {
      id: 1,
      name: 'Ualdo Owner',
      role: 'owner',
      capabilities: {
        is_owner: true,
        role: 'owner',
      },
    };

    render(<ModuleGrid user={ownerUser} onSelectModule={vi.fn()} />);

    expect(screen.getByText('Inventario')).toBeInTheDocument();
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Cierre de caja')).toBeInTheDocument();
    expect(screen.getByText('Ventas')).toBeInTheDocument();
    expect(screen.getByText('Cierre del día')).toBeInTheDocument();
    expect(screen.getByText('Retiros de bodega')).toBeInTheDocument();
    expect(screen.getByText('Horas extra')).toBeInTheDocument();
    expect(screen.getByText('Vajilla y equipos')).toBeInTheDocument();
    expect(screen.queryByText('Mi cierre de caja')).not.toBeInTheDocument();
  });

  it('un admin ve todos los módulos de la portada pero no Mi cierre de caja', () => {
    const adminUser = {
      id: 2,
      capabilities: {
        role: ROLES.ADMIN,
        abilities: [
          ABILITIES.INVENTORY_VIEW,
          ABILITIES.SUPPLY_REQUEST,
          ABILITIES.CASH_REVIEW,
          ABILITIES.CASH_REGISTER,
          ABILITIES.SALES_TOTALS,
          ABILITIES.SETTINGS_MANAGE,
          ABILITIES.PURCHASES_MANAGE,
        ],
      },
    };

    render(<ModuleGrid user={adminUser} onSelectModule={vi.fn()} />);

    expect(screen.getByText('Inventario')).toBeInTheDocument();
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Cierre de caja')).toBeInTheDocument();
    expect(screen.getByText('Ventas')).toBeInTheDocument();
    expect(screen.queryByText('Mi cierre de caja')).not.toBeInTheDocument();
  });

  it('un usuario con assets.count.lounge ve la tarjeta Vajilla y equipos', () => {
    const assetCounter = {
      id: 30,
      capabilities: {
        abilities: [ABILITIES.ASSETS_COUNT_LOUNGE],
      },
    };
    const onSelect = vi.fn();

    render(<ModuleGrid user={assetCounter} onSelectModule={onSelect} />);

    const card = screen.getByRole('button', { name: /Vajilla y equipos:/i });
    expect(card).toBeInTheDocument();

    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith('assets');
  });

  it('un kitchen_head con overtime.register.kitchen ve la tarjeta Horas extra (Brief 36p)', () => {
    const kitchenHeadUser = {
      id: 22,
      capabilities: {
        role: ROLES.KITCHEN_HEAD,
        abilities: [
          ABILITIES.OVERTIME_REGISTER_KITCHEN,
        ],
      },
    };
    const onSelect = vi.fn();

    render(<ModuleGrid user={kitchenHeadUser} onSelectModule={onSelect} />);

    const overtimeCard = screen.getByRole('button', { name: /Horas extra:/i });
    expect(overtimeCard).toBeInTheDocument();

    fireEvent.click(overtimeCard);
    expect(onSelect).toHaveBeenCalledWith('overtime');
  });

  it('al tocar una tarjeta de módulo llama a onSelectModule con su subView', () => {
    const ownerUser = {
      id: 1,
      role: 'owner',
      capabilities: { is_owner: true },
    };
    const onSelect = vi.fn();

    render(<ModuleGrid user={ownerUser} onSelectModule={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /Ventas:/i }));
    expect(onSelect).toHaveBeenCalledWith('ventas');

    fireEvent.click(screen.getByRole('button', { name: /Inventario:/i }));
    expect(onSelect).toHaveBeenCalledWith('inventory');

    fireEvent.click(screen.getByRole('button', { name: /Cierre del día:/i }));
    expect(onSelect).toHaveBeenCalledWith('daily_close');

    fireEvent.click(screen.getByRole('button', { name: /Vajilla y equipos:/i }));
    expect(onSelect).toHaveBeenCalledWith('assets');
  });

  it('un salón con reservations.view ve la tarjeta Reservas con las reservas de hoy (Brief 39p)', async () => {
    vi.spyOn(reservationsClient, 'listReservations').mockResolvedValue({
      ok: true,
      data: { data: [], meta: { current_page: 1, last_page: 1, total: 3 } },
    });
    const user = {
      id: 40,
      capabilities: { role: ROLES.LOUNGE_STAFF, abilities: [ABILITIES.RESERVATIONS_VIEW] },
    };
    const onSelect = vi.fn();

    render(<ModuleGrid user={user} onSelectModule={onSelect} />);

    const card = screen.getByRole('button', { name: /Reservas:/i });
    expect(card).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith('reservations');
  });

  it('muestra mensaje informativo si el usuario no tiene módulos habilitados', () => {
    const restrictedUser = {
      id: 99,
      capabilities: { abilities: [] },
    };

    render(<ModuleGrid user={restrictedUser} onSelectModule={vi.fn()} />);
    expect(screen.getByText('No tienes módulos disponibles para tu cargo actual.')).toBeInTheDocument();
  });

  it('dos renders seguidos con el mismo usuario hacen una sola llamada a retiros', async () => {
    const spy = vi.spyOn(withdrawalsClient, 'listWithdrawals').mockResolvedValue({
      ok: true,
      data: [
        { id: 1, user_id: 10, status: 'open' },
        { id: 2, user_id: 10, status: 'escalated' },
      ],
    });

    const userInstance1 = {
      id: 10,
      capabilities: { abilities: [ABILITIES.WITHDRAWALS_DECLARE] },
    };
    const userInstance2 = {
      id: 10,
      capabilities: { abilities: [ABILITIES.WITHDRAWALS_DECLARE] },
    };

    const { rerender } = render(<ModuleGrid user={userInstance1} onSelectModule={vi.fn()} />);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    rerender(<ModuleGrid user={userInstance2} onSelectModule={vi.fn()} />);

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
