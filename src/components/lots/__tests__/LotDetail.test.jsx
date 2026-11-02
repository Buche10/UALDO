import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import LotDetail from '../LotDetail';
import * as lotsClient from '../../../services/lotsClient';

const detail = {
  id: 12,
  code: 'L0001',
  status: 'activo',
  item: { id: 4, name: 'Bife de res' },
  supplier: { id: 2, name: 'Carnes del Sur' },
  purchase: { id: 22, invoice_number: 'FAC-001', purchased_on: '2026-11-01', line_id: 41 },
  received_on: '2026-11-01',
  received_weight: 10,
  balances: [{ item_id: 4, item: 'Bife de res', location: 'kitchen', location_label: 'Cocina', quantity: 3 }],
  productions: [{ id: 9, template_name: 'Porcionado de bife', status: 'completed', real_yield_pct: 95, waste_quantity: 0.5, input_weight: 10, input_cost_cents: 15000 }],
  cost: { unit_cost: 15, line_total_cents: 15000 },
  movements: {
    data: [{ id: 1, kind: 'porcionado_salida', quantity: -10, item: 'Bife de res', location: 'kitchen', fifo_skipped: true, justification: 'Reservado para el evento', user: 'Carla', created_at: '2026-11-02T10:00:00Z' }],
    meta: { current_page: 1, last_page: 1, total: 1 },
  },
};

describe('LotDetail (Brief 40p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(lotsClient, 'getLot').mockResolvedValue({ ok: true, data: { data: detail } });
  });

  it('muestra proveedor, factura, porcionados y resalta los saltos de FIFO', async () => {
    render(<LotDetail lotId={12} canManage={false} canSeeCosts={false} onBack={vi.fn()} onChanged={vi.fn()} />);

    expect(await screen.findByText('L0001')).toBeInTheDocument();
    expect(screen.getByText('Carnes del Sur')).toBeInTheDocument();
    expect(screen.getByText(/FAC-001/)).toBeInTheDocument();
    expect(screen.getByText(/Rendimiento 95/)).toBeInTheDocument();
    expect(screen.getByText(/Saltó el FIFO: Reservado para el evento/)).toBeInTheDocument();
    expect(screen.queryByText('Costo')).not.toBeInTheDocument();
  });

  it('muestra costos solo con inventory.costs', async () => {
    const { rerender } = render(<LotDetail lotId={12} canManage={false} canSeeCosts={false} onBack={vi.fn()} onChanged={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('L0001')).toBeInTheDocument());
    expect(screen.queryByText('Costo')).not.toBeInTheDocument();

    rerender(<LotDetail lotId={12} canManage={false} canSeeCosts onBack={vi.fn()} onChanged={vi.fn()} />);
    expect(screen.getByText('Costo')).toBeInTheDocument();
    expect(screen.getByText(/por unidad/)).toBeInTheDocument();
  });
});
