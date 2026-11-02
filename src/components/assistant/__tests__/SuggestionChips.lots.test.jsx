import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SuggestionChips from '../SuggestionChips';
import { ABILITIES } from '../../../services/permissions';
import * as inventoryClient from '../../../services/inventoryClient';

const user = { id: 5, capabilities: { abilities: [ABILITIES.INVENTORY_VIEW] } };

describe('SuggestionChips de lotes (Brief 40p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('con inventory.view e insumos con lote muestra "¿Qué lote uso?"', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: { items: [{ id: 4, name: 'Bife de res', requires_lot: true }], meta: { current_page: 1, last_page: 1 } },
    });
    const onSelect = vi.fn();
    render(<SuggestionChips user={user} onSelectChip={onSelect} hasOpenWithdrawals={false} />);

    const chip = await screen.findByRole('button', { name: '¿Qué lote uso?' });
    fireEvent.click(chip);
    expect(onSelect).toHaveBeenCalledWith('¿Qué lote de carne tengo que usar primero?');
  });

  it('sin insumos con lote no muestra el acceso', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: { items: [{ id: 4, name: 'Arroz', requires_lot: false }], meta: { current_page: 1, last_page: 1 } },
    });
    render(<SuggestionChips user={user} onSelectChip={vi.fn()} hasOpenWithdrawals={false} />);

    await waitFor(() => expect(inventoryClient.listInventory).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: '¿Qué lote uso?' })).not.toBeInTheDocument();
  });
});
