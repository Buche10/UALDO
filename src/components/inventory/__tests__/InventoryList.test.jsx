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

  it('renders code, "Familia / Categoría", storage label with icon, "Preparado" and "Inactivo"', () => {
    const items = [
      {
        id: 1,
        name: 'Carne Molida',
        code: 'CAR-001',
        stock: '10.000',
        unit: 'kg',
        category: {
          id: 5,
          name: 'Res',
          family: { id: 2, name: 'Carnes' },
        },
        storage_type: 'refrigerated',
        product_kind: 'prepared',
        is_active: false,
      },
    ];

    render(
      <InventoryList
        activeTab="all"
        items={items}
        alerts={[]}
        hasMore={false}
        loadingMore={false}
        onLoadMore={vi.fn()}
        onSelectForMovement={vi.fn()}
        onSelectForHistory={vi.fn()}
      />
    );

    expect(screen.getByText('Carne Molida')).toBeInTheDocument();
    expect(screen.getByText('CAR-001')).toBeInTheDocument();
    expect(screen.getByText('Carnes / Res')).toBeInTheDocument();
    expect(screen.getByText('Refrigerado')).toBeInTheDocument();
    expect(screen.getByText('Preparado')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('renders ambient and frozen storage types', () => {
    const items = [
      {
        id: 1,
        name: 'Arroz',
        stock: '5.000',
        unit: 'kg',
        storage_type: 'ambient',
      },
      {
        id: 2,
        name: 'Pescado',
        stock: '3.000',
        unit: 'kg',
        storage_type: 'frozen',
      },
    ];

    render(
      <InventoryList
        activeTab="all"
        items={items}
        alerts={[]}
        hasMore={false}
        loadingMore={false}
        onLoadMore={vi.fn()}
        onSelectForMovement={vi.fn()}
        onSelectForHistory={vi.fn()}
      />
    );

    expect(screen.getByText('Ambiente')).toBeInTheDocument();
    expect(screen.getByText('Congelado')).toBeInTheDocument();
  });

  it('renders category without family without separator', () => {
    const items = [
      {
        id: 1,
        name: 'Vino Tinto',
        stock: '2.000',
        unit: 'botella',
        category: { id: 3, name: 'Bebidas' },
      },
      {
        id: 2,
        name: 'Sal',
        stock: '1.000',
        unit: 'kg',
        category: null,
      },
    ];

    render(
      <InventoryList
        activeTab="all"
        items={items}
        alerts={[]}
        hasMore={false}
        loadingMore={false}
        onLoadMore={vi.fn()}
        onSelectForMovement={vi.fn()}
        onSelectForHistory={vi.fn()}
      />
    );

    expect(screen.getByText('Bebidas')).toBeInTheDocument();
    expect(screen.queryByText(/\//)).not.toBeInTheDocument();
  });

  it('tolerates undefined catalog fields without errors', () => {
    const items = [
      {
        id: 99,
        name: 'Insumo Sin Campos Nuevos',
        stock: '4.000',
        unit: 'unidad',
        // code, category, storage_type, product_kind, is_active undefined
      },
    ];

    render(
      <InventoryList
        activeTab="all"
        items={items}
        alerts={[]}
        hasMore={false}
        loadingMore={false}
        onLoadMore={vi.fn()}
        onSelectForMovement={vi.fn()}
        onSelectForHistory={vi.fn()}
      />
    );

    expect(screen.getByText('Insumo Sin Campos Nuevos')).toBeInTheDocument();
    expect(screen.queryByText('Inactivo')).not.toBeInTheDocument();
    expect(screen.queryByText('Preparado')).not.toBeInTheDocument();
  });

  it('renders malicious category name as plain text without executing XSS', () => {
    const xssPayload = '<img src=x onerror=alert(1)>';
    const items = [
      {
        id: 1,
        name: 'Insumo Seguro',
        stock: '1.000',
        unit: 'kg',
        category: {
          id: 1,
          name: xssPayload,
        },
      },
    ];

    const { container } = render(
      <InventoryList
        activeTab="all"
        items={items}
        alerts={[]}
        hasMore={false}
        loadingMore={false}
        onLoadMore={vi.fn()}
        onSelectForMovement={vi.fn()}
        onSelectForHistory={vi.fn()}
      />
    );

    expect(screen.getByText(xssPayload)).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});
