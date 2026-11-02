import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InvoiceReview from '../InvoiceReview';
import * as purchaseDocumentsClient from '../../../../services/purchaseDocumentsClient';
import * as purchasesClient from '../../../../services/purchasesClient';
import * as inventoryClient from '../../../../services/inventoryClient';
import { pageOf, supplier } from '../../../../hooks/__tests__/purchaseFixtures';

const extraction = {
  supplier_name: 'Proveedor Ficticio S.A.',
  supplier_tax_id: '1790012345001',
  invoice_number: '001-002-000123456',
  invoice_date: '2026-01-15',
  buyer_tax_id: '1790099999001',
  subtotal: '100.00',
  tax: '15.00',
  total: '115.00',
  lines: [
    {
      description: 'Bife de chorizo', code: 'BIFE01', quantity: '5.000', unit: 'kg',
      unit_price: '20.00', line_total: '100.00', item_id: 7, match_source: 'name',
      needs_review: true, review_reasons: ['Confirma que el insumo sea correcto.'],
    },
    {
      description: 'Papa chola', code: 'PAPA01', quantity: '3.000', unit: 'kg',
      unit_price: '10.00', line_total: '30.00', item_id: null, match_source: 'none',
      needs_review: true, review_reasons: ['Elige el insumo del catálogo.'],
    },
  ],
  header_review_reasons: ['La factura no está a nombre del negocio.'],
  supplier_id: null,
  supplier_proposal: { name: 'Proveedor Ficticio S.A.', tax_id: '1790012345001' },
};

function documentOf(overrides = {}) {
  return { id: 12, status: 'extracted', extraction, purchase_id: null, confirmed_at: null, ...overrides };
}

describe('InvoiceReview (Brief 34ap)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(purchasesClient, 'listSuppliers').mockResolvedValue(pageOf([supplier]));
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({ ok: true, data: { items: [] } });
  });

  it('bloquea la confirmación hasta revisar líneas, cabecera y proveedor', async () => {
    vi.spyOn(purchaseDocumentsClient, 'getInvoiceDocument').mockResolvedValue({ ok: true, data: documentOf() });
    const confirm = vi.spyOn(purchaseDocumentsClient, 'confirmInvoice').mockResolvedValue({
      ok: true, data: { id: 12 }, purchase: { id: 9, status: 'draft' },
    });
    const onConfirmed = vi.fn();
    render(<InvoiceReview documentId={12} onBack={vi.fn()} onConfirmed={onConfirmed} onManualEntry={vi.fn()} />);

    await waitFor(() => expect(screen.getByText(/Proveedor Ficticio S\.A\./)).toBeInTheDocument());
    await screen.findByRole('option', { name: 'Carnes del Valle' });
    expect(screen.getByText('La factura no está a nombre del negocio.')).toBeInTheDocument();
    expect(screen.getByText('Confirma que el insumo sea correcto.')).toBeInTheDocument();
    expect(screen.getAllByText('Revisar')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Proveedor'), { target: { value: '4' } });
    expect(screen.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled();

    fireEvent.click(screen.getByLabelText('Revisé la cabecera'));
    expect(screen.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled();

    const reviews = screen.getAllByLabelText('Revisé esta línea');
    fireEvent.click(reviews[0]);
    expect(screen.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Motivo (obligatorio)'), { target: { value: 'No está en el catálogo' } });
    fireEvent.click(screen.getAllByLabelText('Revisé esta línea')[1]);

    const button = screen.getByRole('button', { name: 'Confirmar compra' });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);

    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    expect(confirm).toHaveBeenCalledWith(12, {
      supplier_id: 4,
      lines: [
        { source_index: 0, quantity: '5.000', line_total: '100.00', item_id: 7 },
        { source_index: 1, quantity: '3.000', line_total: '30.00', is_other: true, free_text_name: 'Papa chola', note: 'No está en el catálogo', unit: 'kg' },
      ],
    });
    expect(onConfirmed).toHaveBeenCalledWith({ id: 9, status: 'draft' });
  });

  it('cambia el insumo sugerido y permite marcar la línea como otra compra', async () => {
    vi.spyOn(purchaseDocumentsClient, 'getInvoiceDocument').mockResolvedValue({
      ok: true,
      data: documentOf({ extraction: { ...extraction, supplier_id: 3, header_review_reasons: [] } }),
    });
    const confirm = vi.spyOn(purchaseDocumentsClient, 'confirmInvoice').mockResolvedValue({ ok: true, purchase: { id: 9 } });
    render(<InvoiceReview documentId={12} onBack={vi.fn()} onConfirmed={vi.fn()} onManualEntry={vi.fn()} />);

    await waitFor(() => expect(screen.getByText(/Línea 1: Bife de chorizo/)).toBeInTheDocument());
    inventoryClient.listInventory.mockResolvedValue({ ok: true, data: { items: [{ id: 31, name: 'Lomo fino', code: 'LOM-1', unit: 'kg', type: 'supply' }] } });
    fireEvent.change(screen.getByLabelText('Buscar insumo para la línea 1'), { target: { value: 'lomo' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Lomo fino (LOM-1)' })).toBeInTheDocument(), { timeout: 2000 });
    fireEvent.click(screen.getByRole('button', { name: 'Lomo fino (LOM-1)' }));
    expect(screen.getByText('Lomo fino')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Otras compras' })[0]);
    expect(screen.getAllByText('Otras compras').length).toBeGreaterThan(1);

    const reviews = screen.getAllByLabelText('Revisé esta línea');
    fireEvent.change(screen.getAllByLabelText('Motivo (obligatorio)')[0], { target: { value: 'No está en el catálogo' } });
    fireEvent.change(screen.getAllByLabelText('Motivo (obligatorio)')[1], { target: { value: 'No está en el catálogo' } });
    fireEvent.click(reviews[0]);
    fireEvent.click(screen.getAllByLabelText('Revisé esta línea')[1]);

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar compra' }));
    await waitFor(() => expect(confirm).toHaveBeenCalled());
    const payload = confirm.mock.calls[0][1].lines[0];
    expect(payload.is_other).toBe(true);
    expect(payload.source_index).toBe(0);
    expect(payload.item_id).toBeUndefined();
  });

  it('muestra el error del SRI y la salida a carga manual', async () => {
    vi.spyOn(purchaseDocumentsClient, 'getInvoiceDocument').mockResolvedValue({
      ok: true, data: { id: 12, status: 'failed', error_code: 'not_authorized' },
    });
    const onManualEntry = vi.fn();
    render(<InvoiceReview documentId={12} onBack={vi.fn()} onConfirmed={vi.fn()} onManualEntry={onManualEntry} />);

    await waitFor(() => expect(screen.getByText('El SRI no tiene esa factura como autorizada. Revisa la clave.')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Cargar la compra a mano' }));
    expect(onManualEntry).toHaveBeenCalled();
  });

  it('avisa cuando el documento es un duplicado', async () => {
    vi.spyOn(purchaseDocumentsClient, 'getInvoiceDocument').mockResolvedValue({
      ok: true,
      data: documentOf({ extraction: { ...extraction, supplier_id: 3, header_review_reasons: [] } }),
    });
    render(<InvoiceReview documentId={12} duplicate onBack={vi.fn()} onConfirmed={vi.fn()} onManualEntry={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Esta factura ya se cargó')).toBeInTheDocument());
  });
});
