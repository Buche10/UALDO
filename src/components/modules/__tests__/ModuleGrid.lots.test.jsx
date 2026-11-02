import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ModuleGrid from '../ModuleGrid';
import { ABILITIES } from '../../../services/permissions';
import * as inventoryClient from '../../../services/inventoryClient';

const user = { id: 5, capabilities: { abilities: [ABILITIES.INVENTORY_VIEW] } };

describe('ModuleGrid con lotes (Brief 40p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra Lotes de carne si hay insumos con lote', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: { items: [{ id: 4, name: 'Bife de res', requires_lot: true }], meta: { current_page: 1, last_page: 1 } },
    });
    render(<ModuleGrid user={user} onSelectModule={vi.fn()} />);

    expect(await screen.findByText('Lotes de carne')).toBeInTheDocument();
  });

  it('no muestra la tarjeta si no hay insumos con lote', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: { items: [{ id: 4, name: 'Arroz', requires_lot: false }], meta: { current_page: 1, last_page: 1 } },
    });
    render(<ModuleGrid user={user} onSelectModule={vi.fn()} />);

    await waitFor(() => expect(inventoryClient.listInventory).toHaveBeenCalled());
    expect(screen.queryByText('Lotes de carne')).not.toBeInTheDocument();
  });
});
