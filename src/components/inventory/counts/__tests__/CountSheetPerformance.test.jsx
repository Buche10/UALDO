import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CountSheet from '../CountSheet';
import * as inventoryClient from '../../../../services/inventoryClient';
import * as inventoryCountsClient from '../../../../services/inventoryCountsClient';
import { formatQuantity } from '../../../../services/quantityFormat';

// CountSheetRow formatea la cantidad del sistema en cada render: contar las
// llamadas cuenta los renders de las filas de la planilla real.
vi.mock('../../../../services/quantityFormat', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, formatQuantity: vi.fn(actual.formatQuantity) };
});

const ITEMS = Array.from({ length: 240 }, (_, i) => ({
  id: i + 1,
  name: `Insumo ${i + 1}`,
  unit: 'kg',
  type: 'ingredient',
  stock_by_location: { kitchen: 10 },
}));

describe('CountSheet performance with 240 items', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    formatQuantity.mockClear();
    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: { id: 3, location: 'kitchen', location_label: 'Cocina', status: 'draft', lines: [] } },
    });
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: { items: ITEMS, meta: { last_page: 1 } },
    });
  });

  it('typing in one row re-renders only that row of the real sheet', async () => {
    render(<CountSheet countId={3} onBack={vi.fn()} onAppliedComplete={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText('Insumo 240')).toBeInTheDocument());

    formatQuantity.mockClear();
    fireEvent.change(screen.getByLabelText('Insumo 42'), { target: { value: '15' } });

    expect(screen.getByLabelText('Insumo 42')).toHaveValue('15');
    // Una sola fila vuelve a renderizar. Sin React.memo en CountSheetRow, o con
    // un updateQuantity inestable, serían 240.
    expect(formatQuantity).toHaveBeenCalledTimes(1);
  });
});
