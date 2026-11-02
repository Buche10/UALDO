import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ItemLotSettings from '../ItemLotSettings';
import * as lotsClient from '../../../services/lotsClient';
import { ABILITIES } from '../../../services/permissions';

const item = { id: 4, name: 'Bife de res', requires_lot: false };

describe('ItemLotSettings (Brief 40p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('ualdo_user', JSON.stringify({ id: 1, capabilities: { abilities: [ABILITIES.SETTINGS_MANAGE] } }));
  });

  it('pide confirmación y activa el control por lotes', async () => {
    const spy = vi.spyOn(lotsClient, 'setRequiresLot').mockResolvedValue({
      ok: true,
      data: { data: { ...item, requires_lot: true } },
    });
    const onSaved = vi.fn();
    render(<ItemLotSettings item={item} onSaved={onSaved} />);

    fireEvent.click(screen.getByLabelText('Controlar por lotes (solo carnes)'));
    expect(screen.getByText('Se creará un lote inicial con el stock actual.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Activar' }));

    await waitFor(() => expect(spy).toHaveBeenCalledWith(4, true));
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ requires_lot: true }));
  });

  it('no se muestra sin settings.manage', () => {
    localStorage.setItem('ualdo_user', JSON.stringify({ id: 2, capabilities: { abilities: [] } }));
    const { container } = render(<ItemLotSettings item={item} onSaved={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
