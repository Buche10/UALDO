import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InventoryList from '../InventoryList';

describe('InventoryList component', () => {
  it('renders alerts view and displays suggested_qty and stock min levels', () => {
    const alerts = [
      {
        id: 1,
        name: 'Aceite de Oliva',
        stock: '1.200',
        min_stock: '5.000',
        unit: 'L',
        suggested_qty: '3.800',
      },
    ];

    render(
      <InventoryList
        activeTab="alerts"
        items={[]}
        alerts={alerts}
        hasMore={false}
        loadingMore={false}
        onLoadMore={vi.fn()}
        onSelectForMovement={vi.fn()}
        onSelectForHistory={vi.fn()}
      />
    );

    expect(screen.getByText('Aceite de Oliva')).toBeInTheDocument();
    expect(screen.getByText(/Stock actual: 1.200 L/i)).toBeInTheDocument();
    expect(screen.getByText('3.800 L')).toBeInTheDocument();
  });

  it('renders empty alerts state when no alerts exist', () => {
    render(
      <InventoryList
        activeTab="alerts"
        items={[]}
        alerts={[]}
        hasMore={false}
        loadingMore={false}
        onLoadMore={vi.fn()}
        onSelectForMovement={vi.fn()}
        onSelectForHistory={vi.fn()}
      />
    );

    expect(screen.getByText(/No hay alertas de compra activas/i)).toBeInTheDocument();
  });

  it('renders empty items state when items list is empty', () => {
    render(
      <InventoryList
        activeTab="all"
        items={[]}
        alerts={[]}
        hasMore={false}
        loadingMore={false}
        onLoadMore={vi.fn()}
        onSelectForMovement={vi.fn()}
        onSelectForHistory={vi.fn()}
      />
    );

    expect(screen.getByText('No se encontraron insumos.')).toBeInTheDocument();
  });

  it('renders items, marks low stock badge, and wires movement and history actions', () => {
    const items = [
      {
        id: 10,
        name: 'Tomate Rinon',
        stock: '0.800',
        unit: 'kg',
        is_low_stock: true,
      },
      {
        id: 20,
        name: 'Cebolla Paitena',
        stock: '15.000',
        unit: 'kg',
        is_low_stock: false,
      },
    ];

    const handleMovement = vi.fn();
    const handleHistory = vi.fn();
    const handleLoadMore = vi.fn();

    const { rerender } = render(
      <InventoryList
        activeTab="low_stock"
        items={items}
        alerts={[]}
        hasMore={true}
        loadingMore={false}
        onLoadMore={handleLoadMore}
        onSelectForMovement={handleMovement}
        onSelectForHistory={handleHistory}
      />
    );

    expect(screen.getByText('Tomate Rinon')).toBeInTheDocument();
    expect(screen.getByText('Bajo')).toBeInTheDocument();
    expect(screen.getByText('Cebolla Paitena')).toBeInTheDocument();

    const moveBtns = screen.getAllByRole('button', { name: /Mover/i });
    fireEvent.click(moveBtns[0]);
    expect(handleMovement).toHaveBeenCalledWith(items[0]);

    const historyBtns = screen.getAllByTitle('Ver historial de movimientos');
    fireEvent.click(historyBtns[1]);
    expect(handleHistory).toHaveBeenCalledWith(items[1]);

    const loadMoreBtn = screen.getByRole('button', { name: /Cargar más insumos/i });
    fireEvent.click(loadMoreBtn);
    expect(handleLoadMore).toHaveBeenCalledTimes(1);

    // Verify button hides when hasMore is false
    rerender(
      <InventoryList
        activeTab="low_stock"
        items={items}
        alerts={[]}
        hasMore={false}
        loadingMore={false}
        onLoadMore={handleLoadMore}
        onSelectForMovement={handleMovement}
        onSelectForHistory={handleHistory}
      />
    );
    expect(screen.queryByRole('button', { name: /Cargar más insumos/i })).not.toBeInTheDocument();
  });
});
