import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModuleGrid from '../ModuleGrid';
import { ABILITIES, ROLES } from '../../../services/permissions';

describe('ModuleGrid component (Brief 30p)', () => {
  it('un lounge_staff no ve Ventas ni Cierre de caja, pero sí ve Inventario y Pedidos', () => {
    // Matriz Brief 30: lounge_staff tiene supply.request, inventory.view, inventory.move,
    // inventory.count.lounge, withdrawals.declare, incidents.report, assets.count.lounge, reservations.view
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

  it('un lounge_head ve Cierre de caja (por cash.register), Inventario y Pedidos, pero no Ventas', () => {
    // Matriz Brief 30: lounge_head tiene cash.register pero no sales.totals ni team.manage
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

    render(<ModuleGrid user={loungeHeadUser} onSelectModule={vi.fn()} />);

    expect(screen.getByText('Inventario')).toBeInTheDocument();
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Cierre de caja')).toBeInTheDocument();
    expect(screen.queryByText('Ventas')).not.toBeInTheDocument();
  });

  it('un admin ve todos los módulos de la portada (Inventario, Pedidos, Cierre y Ventas)', () => {
    // Matriz Brief 30: admin tiene todos menos team.manage
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
  });

  it('muestra mensaje informativo si el usuario no tiene módulos habilitados', () => {
    const restrictedUser = {
      id: 99,
      capabilities: { abilities: [] },
    };

    render(<ModuleGrid user={restrictedUser} onSelectModule={vi.fn()} />);
    expect(screen.getByText('No tienes módulos disponibles para tu cargo actual.')).toBeInTheDocument();
  });
});
