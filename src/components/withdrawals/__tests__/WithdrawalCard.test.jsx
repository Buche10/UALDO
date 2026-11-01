import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WithdrawalCard from '../WithdrawalCard';

describe('WithdrawalCard (Brief 32p & 32p_fix)', () => {
  const dummy = {
    id: 1,
    status: 'open',
    to_location: 'kitchen',
    purpose: 'Mise en place',
    user: { id: 10, name: 'Pedro Pascal' },
    lines: [
      { id: 1, item_name: 'Pimienta', quantity: '0.500', unit: 'kg' },
    ],
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

  it('un retiro cerrado muestra usado, devuelto, lo que quedó y la nota de cierre', () => {
    const closedWithdrawal = {
      id: 2,
      status: 'closed',
      to_location: 'kitchen',
      purpose: 'Producción salsa',
      closing_note: 'Sobró un poco y se guardó en frasco rotulado.',
      lines: [
        {
          id: 10,
          item_name: 'Tomate triturado',
          quantity: '10.000',
          unit: 'kg',
          consumed_quantity: '7.500',
          returned_quantity: '1.500',
          kept_quantity: '1.000',
        },
      ],
    };

    render(
      <WithdrawalCard
        withdrawal={closedWithdrawal}
        currentUser={{ id: 10, capabilities: { abilities: [] } }}
        onCloseClick={vi.fn()}
        onCancelClick={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Detalles'));

    expect(screen.getByText(/Usado: 7.500/i)).toBeInTheDocument();
    expect(screen.getByText(/Devuelto: 1.500/i)).toBeInTheDocument();
    expect(screen.getByText(/Quedó: 1.000/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Nota de cierre: Sobró un poco y se guardó en frasco rotulado\./i)
    ).toBeInTheDocument();
  });

  it('un retiro cancelado muestra el motivo de cancelación', () => {
    const cancelledWithdrawal = {
      id: 3,
      status: 'cancelled',
      to_location: 'lounge',
      purpose: 'Bebidas',
      cancellation_note: 'Selección de insumo equivocada por el salón.',
      lines: [],
    };

    render(
      <WithdrawalCard
        withdrawal={cancelledWithdrawal}
        currentUser={{ id: 10, capabilities: { abilities: [] } }}
        onCloseClick={vi.fn()}
        onCancelClick={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Detalles'));

    expect(
      screen.getByText(/Motivo de cancelación: Selección de insumo equivocada por el salón\./i)
    ).toBeInTheDocument();
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
