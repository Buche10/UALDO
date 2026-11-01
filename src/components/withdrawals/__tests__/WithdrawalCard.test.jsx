import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WithdrawalCard from '../WithdrawalCard';

describe('WithdrawalCard (Brief 32p)', () => {
  const dummy = {
    id: 1,
    status: 'open',
    to_location: 'kitchen',
    purpose: 'Mise en place',
    user: { id: 10, name: 'Pedro Pascal' },
    lines: [
      { id: 1, item_name: 'Pimienta', quantity: '0.500', unit: 'kg' },
    ],
    note: 'Nota de prueba',
  };

  it('renderiza información básica y autor cuando showAuthor es true', () => {
    render(
      <WithdrawalCard
        withdrawal={dummy}
        currentUser={{ id: 10, capabilities: { abilities: [] } }}
        showAuthor={true}
        onCloseClick={vi.fn()}
        onCancelClick={vi.fn()}
      />
    );

    expect(screen.getByText('Cocina')).toBeInTheDocument();
    expect(screen.getByText('Abierto')).toBeInTheDocument();
    expect(screen.getByText('Por Pedro')).toBeInTheDocument();
    expect(screen.getByText('Mise en place')).toBeInTheDocument();
    expect(screen.getByText(/0.500 kg Pimienta/i)).toBeInTheDocument();
  });

  it('permite alternar la vista de detalles', () => {
    render(
      <WithdrawalCard
        withdrawal={dummy}
        currentUser={{ id: 10, capabilities: { abilities: [] } }}
        onCloseClick={vi.fn()}
        onCancelClick={vi.fn()}
      />
    );

    expect(screen.queryByText(/Nota: Nota de prueba/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Detalles'));

    expect(screen.getByText(/Nota: Nota de prueba/i)).toBeInTheDocument();
  });

  it('dispara los callbacks de cerrar y cancelar', () => {
    const onClose = vi.fn();
    const onCancel = vi.fn();

    render(
      <WithdrawalCard
        withdrawal={dummy}
        currentUser={{ id: 10, capabilities: { abilities: [] } }}
        onCloseClick={onClose}
        onCancelClick={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Cerrar retiro/i }));
    expect(onClose).toHaveBeenCalledWith(dummy);

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(onCancel).toHaveBeenCalledWith(dummy);
  });
});
