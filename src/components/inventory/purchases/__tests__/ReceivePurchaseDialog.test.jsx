import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReceivePurchaseDialog from '../ReceivePurchaseDialog';

describe('ReceivePurchaseDialog component (Brief 33p)', () => {
  const purchase = {
    id: 10,
    lines: [
      { id: 1, item_id: 11, item_name: 'Lomo fino', quantity: '5', unit: 'kg', is_other: false },
      { id: 2, item_id: 12, item_name: 'Papas', quantity: '20', unit: 'kg', is_other: false },
      { id: 3, item_id: null, item_name: 'Detergente industrial', quantity: '2', unit: 'galon', is_other: true },
    ],
  };

  it('prefills billed quantities in step 1 and skips weight for is_other lines', () => {
    render(<ReceivePurchaseDialog isOpen={true} purchase={purchase} onConfirm={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Recepción contra factura' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
    expect(screen.getByText(/Otras compras \(no pide peso\)/)).toBeInTheDocument();
  });

  it('calculates live difference when quantity changes', () => {
    render(<ReceivePurchaseDialog isOpen={true} purchase={purchase} onConfirm={vi.fn()} onClose={vi.fn()} />);

    const lomoInput = screen.getByDisplayValue('5');
    fireEvent.change(lomoInput, { target: { value: '4.5' } });
    expect(screen.getByText(/Diferencia: -0.500 kg/)).toBeInTheDocument();
  });

  it('navigates to step 2 summary and confirms with lines payload', () => {
    const onConfirm = vi.fn();
    render(<ReceivePurchaseDialog isOpen={true} purchase={purchase} onConfirm={onConfirm} onClose={vi.fn()} />);

    // Change lomo to 4.5
    fireEvent.change(screen.getByDisplayValue('5'), { target: { value: '4.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    // Step 2
    expect(screen.getByRole('heading', { name: 'Confirmar recepción' })).toBeInTheDocument();
    expect(screen.getByText(/Se detectaron 1 diferencias contra factura\./)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar recepción' }));
    expect(onConfirm).toHaveBeenCalledWith([
      { line_id: 1, received_quantity: '4.5' },
      { line_id: 2, received_quantity: '20' },
    ]);
  });
});
