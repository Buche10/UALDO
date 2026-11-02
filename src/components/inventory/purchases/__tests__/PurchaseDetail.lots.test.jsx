import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PurchaseDetail from '../PurchaseDetail';
import * as purchasesClient from '../../../../services/purchasesClient';

const purchase = {
  id: 22,
  status: 'draft',
  supplier: { name: 'Carnes del Sur' },
  purchased_on: '2026-11-01',
  total: '150.00',
  invoice_number: 'FAC-001',
  lines: [
    { id: 41, item_id: 4, item_name: 'Bife de res', quantity: '10', unit: 'kg', line_total: '150.00', unit_cost: '15.00', is_other: false },
  ],
};

describe('PurchaseDetail con lotes (Brief 40p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(purchasesClient, 'getPurchase').mockResolvedValue({ ok: true, data: { data: purchase } });
  });

  it('muestra los códigos de lote al recibir y no cierra tocando fuera', async () => {
    vi.spyOn(purchasesClient, 'receivePurchase').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        data: { ...purchase, status: 'received' },
        lots: [{ line_id: 41, code: 'L0001' }],
      },
    });

    render(<PurchaseDetail purchaseId={22} onBack={vi.fn()} onSynced={vi.fn()} />);
    expect(await screen.findByText('Carnes del Sur')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Recibir/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'Continuar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar recepción' }));

    expect(await screen.findByText('Escribe este número en cada funda')).toBeInTheDocument();
    expect(screen.getByText('L0001')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('dialog').parentElement);
    expect(screen.getByText('L0001')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Listo, ya los anoté' }));
    await waitFor(() => expect(screen.queryByText('L0001')).not.toBeInTheDocument());
  });
});
