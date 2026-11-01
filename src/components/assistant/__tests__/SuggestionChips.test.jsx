import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SuggestionChips from '../SuggestionChips';
import { ABILITIES } from '../../../services/permissions';

describe('SuggestionChips (Brief 26p / 30p)', () => {
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
});
