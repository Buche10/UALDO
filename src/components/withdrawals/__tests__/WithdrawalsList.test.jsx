import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WithdrawalsList from '../WithdrawalsList';

describe('WithdrawalsList', () => {
  it('muestra mensaje vacío cuando no hay retiros', () => {
    render(<WithdrawalsList withdrawals={[]} currentUser={{ id: 1 }} />);
    expect(screen.getByText('No hay retiros registrados.')).toBeInTheDocument();
  });

  it('ordena abiertos y escalados primero y luego cerrados/cancelados', () => {
    const list = [
      { id: 1, status: 'closed', purpose: 'Cerrado viejo', created_at: '2026-11-01T10:00:00Z', lines: [] },
      { id: 2, status: 'open', purpose: 'Abierto nuevo', created_at: '2026-11-01T11:00:00Z', lines: [] },
      { id: 3, status: 'escalated', purpose: 'Escalado medio', created_at: '2026-11-01T10:30:00Z', lines: [] },
    ];

    render(
      <WithdrawalsList
        withdrawals={list}
        currentUser={{ id: 1 }}
        onCloseClick={vi.fn()}
        onCancelClick={vi.fn()}
      />
    );

    const cards = screen.getAllByText(/viejo|nuevo|medio/i);
    expect(cards[0]).toHaveTextContent('Abierto nuevo');
    expect(cards[1]).toHaveTextContent('Escalado medio');
    expect(cards[2]).toHaveTextContent('Cerrado viejo');
  });
});
