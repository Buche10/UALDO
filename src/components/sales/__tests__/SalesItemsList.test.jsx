import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SalesItemsList from '../SalesItemsList';

describe('SalesItemsList', () => {
  it('muestra estado de carga inicial', () => {
    render(<SalesItemsList loading={true} items={[]} />);
    expect(screen.getByText('Cargando platos más vendidos...')).toBeInTheDocument();
  });

  it('muestra estado vacio cuando no hay items', () => {
    render(<SalesItemsList loading={false} items={[]} />);
    expect(screen.getByText('No hay artículos vendidos en este periodo.')).toBeInTheDocument();
  });

  it('renderiza articulos con cantidades, totales y participacion', () => {
    const mockItems = [
      {
        id: 1,
        articulo_id: 1,
        descripcion: 'Ceviche Mixto',
        cantidad: '14.000',
        total: '140.00',
        participacion: '45.0'
      },
      {
        id: 2,
        articulo_id: 2,
        descripcion: 'Arroz Marinero',
        cantidad: '8.000',
        total: '96.00',
        participacion: '30.0'
      }
    ];

    render(<SalesItemsList items={mockItems} sort="quantity" />);
    expect(screen.getByText('Platos más vendidos')).toBeInTheDocument();
    expect(screen.getByText('Ceviche Mixto')).toBeInTheDocument();
    expect(screen.getByText('USD 140,00')).toBeInTheDocument();
    expect(screen.getByText('Cant: 14')).toBeInTheDocument();
    expect(screen.getByText('Part: 45.0%')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('permite alternar el orden y refleja aria-pressed', () => {
    const onSortChange = vi.fn();
    render(<SalesItemsList items={[]} sort="quantity" onSortChange={onSortChange} />);

    const qtyBtn = screen.getByRole('button', { name: 'Por cantidad' });
    const totBtn = screen.getByRole('button', { name: 'Por total' });

    expect(qtyBtn).toHaveAttribute('aria-pressed', 'true');
    expect(totBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(totBtn);
    expect(onSortChange).toHaveBeenCalledWith('total');
  });

  it('muestra y llama a cargar mas cuando hasMore es true', () => {
    const onLoadMore = vi.fn();
    render(
      <SalesItemsList
        items={[{ id: 1, descripcion: 'Plato 1', cantidad: '1.000', total: '10.00' }]}
        hasMore={true}
        onLoadMore={onLoadMore}
      />
    );

    const loadMoreBtn = screen.getByRole('button', { name: /cargar más platos/i });
    expect(loadMoreBtn).toBeInTheDocument();
    fireEvent.click(loadMoreBtn);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
