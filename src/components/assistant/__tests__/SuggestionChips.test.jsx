import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SuggestionChips from '../SuggestionChips';

describe('SuggestionChips (Brief 26p)', () => {
  it('el personal ve como primer chip "Reportar faltantes"', () => {
    const onSelect = vi.fn();
    render(<SuggestionChips role="staff" onSelectChip={onSelect} />);

    const chip = screen.getByRole('button', { name: /reportar faltantes/i });
    expect(chip).toBeInTheDocument();

    fireEvent.click(chip);
    expect(onSelect).toHaveBeenCalledWith('Quiero reportar lo que falta en el local');
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
