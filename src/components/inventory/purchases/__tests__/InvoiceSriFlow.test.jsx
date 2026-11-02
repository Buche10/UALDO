import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PurchasesView from '../PurchasesView';
import * as purchasesClient from '../../../../services/purchasesClient';
import * as purchaseDocumentsClient from '../../../../services/purchaseDocumentsClient';
import * as inventoryClient from '../../../../services/inventoryClient';
import { draftPurchase, pageOf, supplier } from '../../../../hooks/__tests__/purchaseFixtures';

const extraction = {
  supplier_name: 'Proveedor Ficticio S.A.',
  supplier_tax_id: '1790012345001',
  invoice_number: '001-002-000123456',
  invoice_date: '2026-01-15',
  total: '115.00',
  tax: '15.00',
  header_review_reasons: [],
  supplier_id: 3,
  lines: [
    { description: 'Bife de chorizo', quantity: '5.000', unit: 'kg', unit_price: '20.00', line_total: '100.00', item_id: 7, needs_review: true, review_reasons: ['Confirma que el insumo sea correcto.'] },
  ],
};

const pendingDocument = { id: 12, status: 'extracted', extraction, purchase_id: null, confirmed_at: null };

describe('Flujo de facturas SRI en Compras (Brief 34ap)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(purchasesClient, 'listPurchases').mockResolvedValue(pageOf([]));
    vi.spyOn(purchasesClient, 'listSuppliers').mockResolvedValue(pageOf([supplier]));
    vi.spyOn(purchasesClient, 'getPurchase').mockResolvedValue({ ok: true, data: { data: draftPurchase } });
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({ ok: true, data: { items: [] } });
    vi.spyOn(purchaseDocumentsClient, 'listInvoiceDocuments').mockResolvedValue({ ok: true, data: [] });
  });

  it('abre el documento existente cuando la carga es un duplicado', async () => {
    vi.spyOn(purchaseDocumentsClient, 'uploadInvoiceXml').mockResolvedValue({ ok: true, data: pendingDocument, duplicate: true });
    vi.spyOn(purchaseDocumentsClient, 'getInvoiceDocument').mockResolvedValue({ ok: true, data: pendingDocument });
    render(<PurchasesView onBack={vi.fn()} />);

    await screen.findByText('Cargar factura del SRI');
    fireEvent.change(screen.getByLabelText('Archivo XML de la factura'), {
      target: { files: [new File(['<factura/>'], 'factura.xml', { type: 'text/xml' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cargar XML' }));

    await waitFor(() => expect(purchaseDocumentsClient.getInvoiceDocument).toHaveBeenCalledWith(12));
    expect(await screen.findByText('Esta factura ya se cargó')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Revisar factura' })).toBeInTheDocument();
  });

  it('al confirmar abre la compra en borrador con el botón Recibir', async () => {
    vi.spyOn(purchaseDocumentsClient, 'listInvoiceDocuments').mockResolvedValue({ ok: true, data: [pendingDocument] });
    vi.spyOn(purchaseDocumentsClient, 'getInvoiceDocument').mockResolvedValue({ ok: true, data: pendingDocument });
    vi.spyOn(purchaseDocumentsClient, 'confirmInvoice').mockResolvedValue({ ok: true, data: pendingDocument, purchase: draftPurchase });
    render(<PurchasesView onBack={vi.fn()} />);

    const historyItem = await screen.findByRole('button', { name: /Proveedor Ficticio S\.A\./ });
    fireEvent.click(historyItem);
    await screen.findByText('Revisar factura');

    fireEvent.click(screen.getByLabelText('Revisé esta línea'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar compra' }));

    await waitFor(() => expect(purchasesClient.getPurchase).toHaveBeenCalledWith(9));
    expect(await screen.findByRole('button', { name: 'Recibir' })).toBeInTheDocument();
    expect(screen.getByText('Factura confirmada. Revisa la compra y recíbela cuando llegue.')).toBeInTheDocument();
  });
});
