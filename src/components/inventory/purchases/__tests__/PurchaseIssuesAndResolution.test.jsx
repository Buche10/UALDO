import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import PurchaseIssuesSection from '../PurchaseIssuesSection';
import * as purchasesClient from '../../../../services/purchasesClient';
import * as auth from '../../../../services/auth';
import { ABILITIES } from '../../../../services/permissions';

describe('PurchaseIssuesSection and resolution modals (Brief 33p)', () => {
  const purchase = {
    id: 10,
    status: 'received_with_issues',
    lines: [
      {
        id: 1,
        item_id: 11,
        item_name: 'Lomo fino',
        quantity: '5.000',
        received_quantity: '3.500',
        difference_quantity: '-1.500',
        receipt_status: 'difference',
        unit: 'kg',
      },
      {
        id: 2,
        item_id: 12,
        item_name: 'Papas',
        quantity: '20.000',
        received_quantity: '18.000',
        difference_quantity: '-2.000',
        receipt_status: 'difference',
        resolution: 'proveedor_completa',
        unit: 'kg',
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(auth, 'getUser').mockReturnValue({
      role: 'admin',
      capabilities: {
        abilities: [
          ABILITIES.PURCHASES_MANAGE,
          ABILITIES.PURCHASES_RECEIVE,
          ABILITIES.INVENTORY_COSTS,
        ],
      },
    });
  });

  it('renders unresolved lines and action buttons', () => {
    render(<PurchaseIssuesSection purchase={purchase} onReload={vi.fn()} />);

    expect(screen.getByText('Por aclarar')).toBeInTheDocument();
    expect(screen.getByText('Lomo fino')).toBeInTheDocument();
    expect(screen.getByText(/Diferencia: -1.500 kg/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resolver' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Llegó el resto' })).toBeInTheDocument();
  });

  it('resolves a line with proveedor_completa and note', async () => {
    const resolveSpy = vi.spyOn(purchasesClient, 'resolveLine').mockResolvedValue({
      ok: true,
      data: { success: true },
    });
    const onReload = vi.fn();
    render(<PurchaseIssuesSection purchase={purchase} onReload={onReload} />);

    fireEvent.click(screen.getByRole('button', { name: 'Resolver' }));
    expect(screen.getByRole('heading', { name: 'Resolver diferencia' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Nota \/ Explicación/), {
      target: { value: 'Proveedor entregará faltante mañana' },
    });

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Resolver' }));

    await waitFor(() => {
      expect(resolveSpy).toHaveBeenCalledWith(10, 1, {
        resolution: 'proveedor_completa',
        note: 'Proveedor entregará faltante mañana',
        corrected_quantity: undefined,
      });
      expect(onReload).toHaveBeenCalled();
    });
  });

  it('receives extra delivery with validated quantity', async () => {
    const extraSpy = vi.spyOn(purchasesClient, 'receiveExtra').mockResolvedValue({
      ok: true,
      data: { success: true },
    });
    const onReload = vi.fn();
    render(<PurchaseIssuesSection purchase={purchase} onReload={onReload} />);

    fireEvent.click(screen.getByRole('button', { name: 'Llegó el resto' }));
    expect(screen.getByRole('heading', { name: 'Llegó el resto' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Cantidad entregada/), {
      target: { value: '1.5' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    await waitFor(() => {
      expect(extraSpy).toHaveBeenCalledWith(10, 2, '1.5');
      expect(onReload).toHaveBeenCalled();
    });
  });
});
