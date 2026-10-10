import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CountSheetRow from '../CountSheetRow';

describe('CountSheetRow component', () => {
  const mockItem = {
    id: 10,
    name: 'Queso Mozzarella',
    code: 'Q-MOZZ',
    unit: 'kg',
    category: { name: 'Lácteos' },
    stock_by_location: { warehouse: 8 },
  };

  it('renders item details, code, category, and responds to input changes', () => {
    const onChange = vi.fn();
    render(
      <CountSheetRow
        item={mockItem}
        locationKey="warehouse"
        countedValue="5"
        showSystemQty={true}
        error={['Error de formato']}
        onChange={onChange}
      />
    );

    expect(screen.getByText('Queso Mozzarella')).toBeInTheDocument();
    expect(screen.getByText('Q-MOZZ')).toBeInTheDocument();
    expect(screen.getByText('Lácteos')).toBeInTheDocument();
    expect(screen.getByText(/Sistema: 8 kg/)).toBeInTheDocument();
    expect(screen.getByText('Error de formato')).toBeInTheDocument();

    const input = screen.getByLabelText('Queso Mozzarella');
    expect(input.value).toBe('5');

    fireEvent.change(input, { target: { value: '6' } });
    expect(onChange).toHaveBeenCalledWith(10, '6');
  });

  it('renders correctly without code, category, or error, and formats null stock as "Sin dato"', () => {
    const minimalItem = {
      id: 11,
      name: 'Sal',
      unit: 'kg',
      stock_by_location: { kitchen: null },
    };

    render(
      <CountSheetRow
        item={minimalItem}
        locationKey="kitchen"
        countedValue=""
        showSystemQty={true}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Sal')).toBeInTheDocument();
    expect(screen.getByText(/Sistema: Sin dato kg/)).toBeInTheDocument();
  });

  it('supports readOnly mode and prevents input changes', () => {
    const onChange = vi.fn();
    render(
      <CountSheetRow
        item={mockItem}
        locationKey="warehouse"
        countedValue="5"
        showSystemQty={false}
        onChange={onChange}
        readOnly={true}
      />
    );

    const input = screen.getByLabelText('Queso Mozzarella');
    expect(input).toHaveAttribute('readonly');
    fireEvent.change(input, { target: { value: '9' } });
    expect(onChange).not.toHaveBeenCalled();
  });
});
