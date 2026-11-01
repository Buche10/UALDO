import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SuggestionChips from '../SuggestionChips';
import { ABILITIES } from '../../../services/permissions';
import * as withdrawalsClient from '../../../services/withdrawalsClient';

describe('SuggestionChips (Brief 26p / 30p / 32p / 32p_fix)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('con supply.decide ve "Qué hay que comprar"', () => {
    const onSelect = vi.fn();
    const deciderUser = {
      id: 5,
      capabilities: { abilities: [ABILITIES.SUPPLY_DECIDE] },
    };
    render(<SuggestionChips user={deciderUser} onSelectChip={onSelect} />);

    expect(screen.queryByRole('button', { name: /lista de compras/i })).not.toBeInTheDocument();

    const chip = screen.getByRole('button', { name: /qué hay que comprar/i });
    expect(chip).toBeInTheDocument();

    fireEvent.click(chip);
    expect(onSelect).toHaveBeenCalledWith('¿Qué hay que comprar?');
  });

  it('sin supply.decide ve "Reportar faltantes"', () => {
    const onSelect = vi.fn();
    const staffUser = {
      id: 6,
      capabilities: { abilities: [ABILITIES.SUPPLY_CREATE] },
    };
    render(<SuggestionChips user={staffUser} onSelectChip={onSelect} />);

    expect(screen.queryByRole('button', { name: /qué hay que comprar/i })).not.toBeInTheDocument();

    const chip = screen.getByRole('button', { name: /reportar faltantes/i });
    expect(chip).toBeInTheDocument();

    fireEvent.click(chip);
    expect(onSelect).toHaveBeenCalledWith('Quiero reportar lo que falta en el local');
  });

  it('sin usuario ve "Reportar faltantes"', () => {
    render(<SuggestionChips onSelectChip={vi.fn()} />);

    expect(screen.getByRole('button', { name: /reportar faltantes/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /qué hay que comprar/i })).not.toBeInTheDocument();
  });

  describe('accesos rápidos de retiros de bodega (Requerimiento 6 & Brief 32p_fix)', () => {
    it('con withdrawals.declare ve "Voy a la bodega" y envía "Voy a retirar de la bodega"', () => {
      const onSelect = vi.fn();
      const user = {
        id: 7,
        capabilities: { abilities: [ABILITIES.WITHDRAWALS_DECLARE] },
      };
      render(<SuggestionChips user={user} onSelectChip={onSelect} hasOpenWithdrawals={false} />);

      const chip = screen.getByRole('button', { name: /voy a la bodega/i });
      expect(chip).toBeInTheDocument();

      fireEvent.click(chip);
      expect(onSelect).toHaveBeenCalledWith('Voy a retirar de la bodega');
      expect(screen.queryByRole('button', { name: /cerrar mi retiro/i })).toBeNull();
    });

    it('con retiros abiertos ve además "Cerrar mi retiro"', () => {
      const onSelect = vi.fn();
      const user = {
        id: 7,
        capabilities: { abilities: [ABILITIES.WITHDRAWALS_DECLARE] },
      };
      render(<SuggestionChips user={user} onSelectChip={onSelect} hasOpenWithdrawals={true} />);

      const chipVoy = screen.getByRole('button', { name: /voy a la bodega/i });
      expect(chipVoy).toBeInTheDocument();

      const chipCerrar = screen.getByRole('button', { name: /cerrar mi retiro/i });
      expect(chipCerrar).toBeInTheDocument();

      fireEvent.click(chipCerrar);
      expect(onSelect).toHaveBeenCalledWith('Cerrar mi retiro');
    });

    it('solo muestra "Cerrar mi retiro" si el usuario actual tiene retiros pendientes propios (open o escalated)', async () => {
      // Retiros de otros usuarios no activan el chip
      vi.spyOn(withdrawalsClient, 'listWithdrawals').mockResolvedValue({
        ok: true,
        data: [
          { id: 1, user_id: 99, status: 'open' },
          { id: 2, user: { id: 88 }, status: 'escalated' },
        ],
      });

      const user = {
        id: 7,
        capabilities: { abilities: [ABILITIES.WITHDRAWALS_DECLARE] },
      };

      const { unmount } = render(<SuggestionChips user={user} onSelectChip={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /voy a la bodega/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /cerrar mi retiro/i })).not.toBeInTheDocument();
      });

      unmount();

      // Ahora la lista incluye un retiro escalado del propio usuario 7
      vi.spyOn(withdrawalsClient, 'listWithdrawals').mockResolvedValue({
        ok: true,
        data: [
          { id: 3, user: { id: 7 }, status: 'escalated' },
        ],
      });

      render(<SuggestionChips user={user} onSelectChip={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cerrar mi retiro/i })).toBeInTheDocument();
      });
    });
  });
});
