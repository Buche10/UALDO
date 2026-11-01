import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SuggestionChips from '../SuggestionChips';
import { ABILITIES } from '../../../services/permissions';

describe('SuggestionChips (Brief 26p / 30p)', () => {
  it('el personal ve como primer chip "Reportar faltantes"', () => {
    const onSelect = vi.fn();
    render(<SuggestionChips role="staff" onSelectChip={onSelect} />);

    const chip = screen.getByRole('button', { name: /reportar faltantes/i });
    expect(chip).toBeInTheDocument();

    fireEvent.click(chip);
    expect(onSelect).toHaveBeenCalledWith('Quiero reportar lo que falta en el local');
  });

  it('el usuario con permiso supply.decide ve "Qué hay que comprar"', () => {
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

  it('el usuario sin permiso supply.decide ve "Reportar faltantes"', () => {
    const staffUser = {
      id: 6,
      capabilities: { abilities: [ABILITIES.SUPPLY_REQUEST] },
    };
    render(<SuggestionChips user={staffUser} onSelectChip={vi.fn()} />);

    expect(screen.getByRole('button', { name: /reportar faltantes/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /qué hay que comprar/i })).not.toBeInTheDocument();
  });

  it('el dueño ve "Qué hay que comprar" en lugar de "Lista de compras"', () => {
    const onSelect = vi.fn();
    render(<SuggestionChips role="owner" onSelectChip={onSelect} />);

    expect(screen.queryByRole('button', { name: /lista de compras/i })).not.toBeInTheDocument();

    const chip = screen.getByRole('button', { name: /qué hay que comprar/i });
    expect(chip).toBeInTheDocument();

    fireEvent.click(chip);
    expect(onSelect).toHaveBeenCalledWith('¿Qué hay que comprar?');
  });

  it('usa sugerencias por defecto si el rol no coincide', () => {
    render(<SuggestionChips role="invitado" onSelectChip={vi.fn()} />);

    expect(screen.getByRole('button', { name: /reportar faltantes/i })).toBeInTheDocument();
  });
});
