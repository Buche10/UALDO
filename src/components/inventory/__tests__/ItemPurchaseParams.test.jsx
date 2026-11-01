import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ItemPurchaseParams from '../ItemPurchaseParams';
import * as purchasesClient from '../../../services/purchasesClient';
import * as auth from '../../../services/auth';
import { ABILITIES } from '../../../services/permissions';

describe('ItemPurchaseParams component', () => {
  const item = {
    id: 15,
    name: 'Harina de trigo',
    unit: 'kg',
    base_quantity: 25,
    min_stock: 10,
    reorder_point: 15,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(auth, 'getUser').mockReturnValue({
      role: 'admin',
      capabilities: { abilities: [ABILITIES.PURCHASES_MANAGE] },
    });
  });

  it('renders base quantity, min stock and reorder point with values', () => {
    render(<ItemPurchaseParams item={item} onSaved={vi.fn()} />);
    expect(screen.getByLabelText(/Base/)).toHaveValue('25');
    expect(screen.getByLabelText(/Mínimo/)).toHaveValue('10');
    expect(screen.getByLabelText(/Punto reposición/)).toHaveValue('15');
  });

  it('submits updated values when saving', async () => {
    const updateSpy = vi.spyOn(purchasesClient, 'updatePurchaseParams').mockResolvedValue({
      ok: true,
      data: {
        data: {
          ...item,
          base_quantity: 30,
          min_stock: 12,
        },
      },
    });
    const onSaved = vi.fn();
    render(<ItemPurchaseParams item={item} onSaved={onSaved} />);

    fireEvent.change(screen.getByLabelText(/Base/), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText(/Mínimo/), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(15, {
        base_quantity: '30',
        min_stock: '12',
        reorder_point: '15',
      });
      expect(onSaved).toHaveBeenCalled();
    });
  });

  it('renders nothing when user lacks purchases.manage', () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({
      role: 'kitchen_staff',
      capabilities: { abilities: [] },
    });
    const { container } = render(<ItemPurchaseParams item={item} onSaved={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
