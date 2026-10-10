import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PurchaseList from '../PurchaseList';
import { money, purchaseLocation, statusLabel, unitCost } from '../purchaseUi';
import { draftPurchase } from '../../../../hooks/__tests__/purchaseFixtures';

const listOf = (overrides) => ({ items: [], loading: false, error: null, hasMore: false, loadMore: vi.fn(), reload: vi.fn(), ...overrides });

describe('PurchaseList', () => {
  it('shows the error with retry, the empty filter and the loading states', () => {
    const reload = vi.fn();
    const { rerender } = render(<PurchaseList list={listOf({ error: 'Error 500', reload })} status="" onStatusChange={vi.fn()} onOpen={vi.fn()} onNew={vi.fn()} />);
    fireEvent.click(screen.getByText('Reintentar'));
    expect(reload).toHaveBeenCalled();
    expect(screen.queryByText('No hay compras con este filtro.')).not.toBeInTheDocument();

    rerender(<PurchaseList list={listOf()} status="received" onStatusChange={vi.fn()} onOpen={vi.fn()} onNew={vi.fn()} />);
    expect(screen.getByText('No hay compras con este filtro.')).toBeInTheDocument();

    rerender(<PurchaseList list={listOf({ loading: true })} status="" onStatusChange={vi.fn()} onOpen={vi.fn()} onNew={vi.fn()} />);
    expect(screen.getByText('Cargando compras...')).toBeInTheDocument();

    const loadMore = vi.fn();
    rerender(<PurchaseList list={listOf({ items: [{ ...draftPurchase, supplier: null, invoice_number: null }], loading: true, hasMore: true, loadMore })} status="" onStatusChange={vi.fn()} onOpen={vi.fn()} onNew={vi.fn()} />);
    expect(screen.getByText('Proveedor')).toBeInTheDocument();
    expect(screen.getByText('2026-10-09')).toBeInTheDocument();
    expect(screen.getByText('Cargando más...')).toBeInTheDocument();
  });
});

describe('purchaseUi', () => {
  it('formats engine values and missing data without computing', () => {
    expect(statusLabel('received')).toBe('Recibida');
    expect(statusLabel('otro')).toBe('Sin dato');
    expect(money(null)).toBe('Sin dato');
    expect(money(87.6)).toBe('USD 87,60');
    expect(unitCost(null)).toBe('Sin dato');
    expect(unitCost('abc')).toBe('Sin dato');
    expect(unitCost(5.625)).toBe('USD 5,625');
    expect(purchaseLocation({ location: 'kitchen' })).toBe('Cocina');
    expect(purchaseLocation({ location_label: 'Bodega' })).toBe('Bodega');
  });
});
