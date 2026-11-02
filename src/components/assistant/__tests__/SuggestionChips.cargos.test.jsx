import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import SuggestionChips from '../SuggestionChips';
import { ABILITIES } from '../../../services/permissions';
import * as inventoryClient from '../../../services/inventoryClient';

const emptyInventory = { ok: true, data: { items: [], meta: { current_page: 1, last_page: 1 } } };

const renderChips = (user) => render(
  <SuggestionChips user={user} onSelectChip={vi.fn()} hasOpenWithdrawals={false} />
);

describe('SuggestionChips por cargo (Brief 42p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue(emptyInventory);
  });

  it('cocina muestra sus tres accesos', async () => {
    renderChips({
      id: 4,
      capabilities: {
        role: 'kitchen_staff',
        abilities: [ABILITIES.INVENTORY_VIEW, ABILITIES.WITHDRAWALS_DECLARE],
      },
    });

    expect(await screen.findByRole('button', { name: 'Voy a la bodega' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar porcionado' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reportar un problema' })).toBeInTheDocument();
  });

  it('salón muestra reservas y reportar un problema', async () => {
    renderChips({ id: 5, capabilities: { role: 'lounge_staff', abilities: [] } });

    expect(await screen.findByRole('button', { name: 'Reservas de hoy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reportar un problema' })).toBeInTheDocument();
  });

  it('jefe de salón agrega el cierre de caja', async () => {
    renderChips({
      id: 6,
      capabilities: { role: 'lounge_head', abilities: [ABILITIES.CASH_REGISTER] },
    });

    expect(await screen.findByRole('button', { name: 'Hacer el cierre de caja' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reservas de hoy' })).toBeInTheDocument();
  });

  it('bodega muestra llegó una compra y contar el cierre del día', async () => {
    renderChips({ id: 7, capabilities: { role: 'warehouse', abilities: [] } });

    expect(await screen.findByRole('button', { name: 'Llegó una compra' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Contar el cierre del día' })).toBeInTheDocument();
  });

  it('administración y dueño muestran sus cuatro accesos', async () => {
    renderChips({ id: 1, role: 'admin', capabilities: { role: 'admin', abilities: [] } });

    expect(await screen.findByRole('button', { name: 'Pedidos por aprobar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lista de compras' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resumen del día' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cargar una factura' })).toBeInTheDocument();
  });

  it('nunca muestra más de cinco accesos', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: { items: [{ id: 1, name: 'Lomo de res', requires_lot: true }], meta: { current_page: 1, last_page: 1 } },
    });

    render(<SuggestionChips
      user={{ id: 1, role: 'owner', capabilities: { is_owner: true, role: 'owner' } }}
      onSelectChip={vi.fn()}
      hasOpenWithdrawals={false}
    />);

    const toolbar = await screen.findByRole('toolbar', { name: /sugerencias rápidas/i });
    expect(within(toolbar).getAllByRole('button').length).toBeLessThanOrEqual(5);
    expect(within(toolbar).getAllByRole('button')).toHaveLength(5);
  });
});
