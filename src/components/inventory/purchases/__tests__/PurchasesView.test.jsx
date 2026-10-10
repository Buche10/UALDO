import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import PurchasesView from '../PurchasesView';
import * as purchasesClient from '../../../../services/purchasesClient';
import * as inventoryClient from '../../../../services/inventoryClient';
import { draftPurchase, inventoryItems, pageOf, supplier } from '../../../../hooks/__tests__/purchaseFixtures';

function dialogButton(name) {
  return within(screen.getByRole('dialog')).getByRole('button', { name });
}

describe('PurchasesView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(purchasesClient, 'listPurchases').mockResolvedValue(pageOf([draftPurchase]));
    vi.spyOn(purchasesClient, 'listSuppliers').mockResolvedValue(pageOf([supplier]));
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({ ok: true, data: { items: inventoryItems } });
  });

  it('creates a draft: supplier, item search without services, lines and the engine total', async () => {
    const create = vi.spyOn(purchasesClient, 'createPurchase').mockResolvedValue({ ok: true, status: 201, data: { data: draftPurchase } });
    render(<PurchasesView onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('USD 87,60')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Nueva compra'));
    await waitFor(() => expect(screen.getByRole('option', { name: 'Carnes del Valle' })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Proveedor'), { target: { value: '4' } });
    expect(screen.getByLabelText('Destino')).toHaveValue('warehouse');

    fireEvent.change(screen.getByLabelText('Agregar insumo'), { target: { value: 'lomo' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Lomo fino (LOM-1)' })).toBeInTheDocument());
    expect(screen.queryByText('Lavado de manteles')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lomo fino (LOM-1)' }));

    expect(screen.getByText('El total y el costo unitario los calcula el motor al guardar.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Cantidad (kg)'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Total pagado (USD)'), { target: { value: '75' } });
    fireEvent.click(screen.getByText('Guardar borrador'));

    await waitFor(() => expect(screen.getByText('Compra guardada como borrador.')).toBeInTheDocument());
    expect(create.mock.calls[0][0]).toEqual(expect.objectContaining({ supplierId: '4', lines: [{ item_id: 31, quantity: '5', line_total: '75', note: '' }] }));
    expect(screen.getByText('Total: USD 87,60')).toBeInTheDocument();
    expect(screen.getByText(/a USD 15,00 c\/u/)).toBeInTheDocument();
  });

  it('shows 422 errors next to their field and line', async () => {
    vi.spyOn(purchasesClient, 'createPurchase').mockResolvedValue({
      ok: false, status: 422, data: { message: 'Datos inválidos.', errors: { invoice_number: ['Esa factura de este proveedor ya está registrada.'], 'lines.0.line_total': ['El total debe tener 2 decimales como máximo.'] } },
    });
    render(<PurchasesView onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Nueva compra')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Nueva compra'));
    fireEvent.change(screen.getByLabelText('Agregar insumo'), { target: { value: 'lomo' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Lomo fino (LOM-1)' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Lomo fino (LOM-1)' }));
    fireEvent.click(screen.getByText('Guardar borrador'));

    await waitFor(() => expect(screen.getByText('Esa factura de este proveedor ya está registrada.')).toBeInTheDocument());
    expect(screen.getByText('El total debe tener 2 decimales como máximo.')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Quitar Lomo fino'));
    expect(screen.getByText('Todavía no hay líneas.')).toBeInTheDocument();
  });

  it('receives a draft after confirming and explains a 409 inside the dialog', async () => {
    const receive = vi.spyOn(purchasesClient, 'receivePurchase')
      .mockResolvedValueOnce({ ok: false, status: 409, data: { message: 'La compra ya no se puede modificar.' } })
      .mockResolvedValueOnce({ ok: true, data: { data: { ...draftPurchase, status: 'received' } } });
    render(<PurchasesView onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Carnes del Valle')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Carnes del Valle'));

    fireEvent.click(screen.getByRole('button', { name: 'Recibir' }));
    expect(screen.getByText(/entra al stock de la ubicación de destino/)).toBeInTheDocument();
    expect(dialogButton('Volver')).toHaveFocus();
    fireEvent.click(dialogButton('Recibir'));
    await waitFor(() => expect(within(screen.getByRole('dialog')).getByText('La compra ya no se puede modificar.')).toBeInTheDocument());

    fireEvent.click(dialogButton('Recibir'));
    await waitFor(() => expect(screen.getByText('Compra recibida: el stock y los costos se actualizaron.')).toBeInTheDocument());
    expect(receive).toHaveBeenCalledWith(9);
    expect(screen.queryByRole('button', { name: 'Recibir' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Carnes del Valle' })).toHaveFocus();
  });

  it('cancels with confirmation, closes with Escape and keeps Tab inside', async () => {
    vi.spyOn(purchasesClient, 'cancelPurchase').mockResolvedValue({ ok: true, data: { data: { ...draftPurchase, status: 'cancelled' } } });
    render(<PurchasesView onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Carnes del Valle')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Carnes del Valle'));

    const trigger = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    const confirm = dialogButton('Cancelar compra');
    confirm.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(dialogButton('Volver')).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(confirm).toHaveFocus();
    fireEvent.click(confirm);
    await waitFor(() => expect(screen.getByText('Compra cancelada.')).toBeInTheDocument());
  });

  it('edits the lines of a draft and shows line errors from the engine', async () => {
    const save = vi.spyOn(purchasesClient, 'replacePurchaseLines')
      .mockResolvedValueOnce({ ok: false, status: 422, data: { errors: { 'lines.1.quantity': ['Cantidad inválida.'] } } })
      .mockResolvedValueOnce({ ok: true, data: { data: draftPurchase } });
    render(<PurchasesView onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Carnes del Valle')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Carnes del Valle'));

    fireEvent.click(screen.getByText('Editar líneas'));
    expect(screen.getAllByLabelText(/Cantidad/)[1]).toHaveValue('10.5');
    fireEvent.click(screen.getByText('Guardar líneas'));
    await waitFor(() => expect(screen.getByText('Cantidad inválida.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Guardar líneas'));
    await waitFor(() => expect(screen.getByText('Líneas guardadas.')).toBeInTheDocument());
    expect(save).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByText('Volver a compras'));
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'received' } });
    await waitFor(() => expect(purchasesClient.listPurchases).toHaveBeenLastCalledWith({ status: 'received', page: 1 }));
  });

  it('shows names and notes as plain text', async () => {
    const xss = '<img src=x onerror=alert(1)>';
    purchasesClient.listPurchases.mockResolvedValue(pageOf([{ ...draftPurchase, supplier: { id: 4, name: xss }, notes: xss, lines: [{ ...draftPurchase.lines[0], item_name: xss }] }]));
    const { container } = render(<PurchasesView onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(xss)).toBeInTheDocument());
    fireEvent.click(screen.getByText(xss));
    expect(screen.getAllByText(xss).length).toBeGreaterThan(1);
    expect(container.querySelector('img')).toBeNull();
  });
});
