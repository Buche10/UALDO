import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import PurchasesView from '../PurchasesView';
import * as purchasesClient from '../../../../services/purchasesClient';
import * as inventoryClient from '../../../../services/inventoryClient';
import { draftPurchase, inventoryItems, listedPurchase, pageOf, supplier } from '../../../../hooks/__tests__/purchaseFixtures';

/**
 * Correcciones de la revisión del Brief 20p.
 */
describe('Brief 20p review fixes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(purchasesClient, 'listPurchases').mockResolvedValue(pageOf([listedPurchase]));
    vi.spyOn(purchasesClient, 'getPurchase').mockResolvedValue({ ok: true, data: { data: draftPurchase } });
    vi.spyOn(purchasesClient, 'listSuppliers').mockResolvedValue(pageOf([supplier]));
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({ ok: true, data: { items: inventoryItems } });
  });

  async function openDraft() {
    render(<PurchasesView onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Carnes del Valle')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Carnes del Valle'));
    await screen.findByText('Editar líneas');
  }

  it('H1: the detail comes from the engine with its lines, and editing starts from them', async () => {
    await openDraft();
    expect(purchasesClient.getPurchase).toHaveBeenCalledWith(9);
    expect(screen.getByText('Arroz')).toBeInTheDocument();

    const save = vi.spyOn(purchasesClient, 'replacePurchaseLines').mockResolvedValue({ ok: true, data: { data: draftPurchase } });
    fireEvent.click(screen.getByText('Editar líneas'));
    fireEvent.click(screen.getByText('Guardar líneas'));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][1].map((line) => line.item_id)).toEqual([31, 47]);
  });

  it('H1: a failed detail load shows the error and retries', async () => {
    purchasesClient.getPurchase
      .mockResolvedValueOnce({ ok: false, status: 0, error: 'Sin conexión' })
      .mockResolvedValueOnce({ ok: true, data: { data: draftPurchase } });
    render(<PurchasesView onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Carnes del Valle')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Carnes del Valle'));
    await waitFor(() => expect(screen.getByText('Sin conexión')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Reintentar'));
    await screen.findByText('Editar líneas');
  });

  it('M1: after a 409 the detail reloads from the engine and the draft actions disappear', async () => {
    vi.spyOn(purchasesClient, 'receivePurchase').mockResolvedValue({ ok: false, status: 409, data: { message: 'La compra ya no se puede modificar.' } });
    await openDraft();
    purchasesClient.getPurchase.mockResolvedValue({ ok: true, data: { data: { ...draftPurchase, status: 'received' } } });

    fireEvent.click(screen.getByRole('button', { name: 'Recibir' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Recibir' }));
    await waitFor(() => expect(screen.queryByText('Editar líneas')).not.toBeInTheDocument());
    expect(screen.getByText(/Recibida\./)).toBeInTheDocument();
  });

  it('M3: the filtered list never shows purchases from another filter', async () => {
    let resolveDrafts;
    purchasesClient.listPurchases
      .mockResolvedValueOnce(pageOf([listedPurchase]))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveDrafts = resolve; }));
    render(<PurchasesView onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Carnes del Valle')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'received' } });
    await waitFor(() => expect(screen.getByText('Cargando compras...')).toBeInTheDocument());
    expect(screen.queryByText('Carnes del Valle')).not.toBeInTheDocument();
    resolveDrafts(pageOf([]));
    await waitFor(() => expect(screen.getByText('No hay compras con este filtro.')).toBeInTheDocument());
  });

  it('M3: a received purchase leaves the drafts filter', async () => {
    vi.spyOn(purchasesClient, 'receivePurchase').mockResolvedValue({ ok: true, data: { data: { ...draftPurchase, status: 'received' } } });
    render(<PurchasesView onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'draft' } });
    await waitFor(() => expect(screen.getByText('Carnes del Valle')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Carnes del Valle'));
    await screen.findByText('Editar líneas');
    fireEvent.click(screen.getByRole('button', { name: 'Recibir' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Recibir' }));
    await waitFor(() => expect(screen.getByText('Compra recibida: el stock y los costos se actualizaron.')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Volver a compras'));
    expect(screen.getByText('No hay compras con este filtro.')).toBeInTheDocument();
  });

  it('M2 and M4: the supplier is searched, stays selected and its error clears when chosen', async () => {
    vi.spyOn(purchasesClient, 'createPurchase').mockResolvedValue({ ok: false, status: 422, data: { message: 'Datos inválidos.', errors: { supplier_id: ['Elige el proveedor.'] } } });
    render(<PurchasesView onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Nueva compra')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Nueva compra'));
    fireEvent.click(screen.getByText('Guardar borrador'));
    await waitFor(() => expect(screen.getByText('Elige el proveedor.')).toBeInTheDocument());

    await waitFor(() => expect(screen.getByRole('option', { name: 'Carnes del Valle' })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Proveedor'), { target: { value: '4' } });
    expect(screen.queryByText('Elige el proveedor.')).not.toBeInTheDocument();

    purchasesClient.listSuppliers.mockResolvedValue(pageOf([{ ...supplier, id: 7, name: 'Lácteos Andinos' }]));
    fireEvent.change(screen.getByLabelText('Buscar proveedor'), { target: { value: 'lac' } });
    await waitFor(() => expect(purchasesClient.listSuppliers).toHaveBeenLastCalledWith({ search: 'lac', includeInactive: false, page: 1 }), { timeout: 2000 });
    await waitFor(() => expect(screen.getByRole('option', { name: 'Lácteos Andinos' })).toBeInTheDocument());
    expect(screen.getByLabelText('Proveedor')).toHaveValue('4');
    expect(screen.getByRole('option', { name: 'Carnes del Valle' })).toBeInTheDocument();
  });

  it('M2: a supplier loading error is shown', async () => {
    purchasesClient.listSuppliers.mockResolvedValue({ ok: false, status: 0, error: 'Sin conexión con proveedores' });
    render(<PurchasesView onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Nueva compra')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Nueva compra'));
    await waitFor(() => expect(screen.getByText('Sin conexión con proveedores')).toBeInTheDocument());
  });

  it('M5: the item search says when it fails or finds nothing, and the focus goes to the new line', async () => {
    render(<PurchasesView onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Nueva compra')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Nueva compra'));

    inventoryClient.listInventory.mockResolvedValueOnce({ ok: false, status: 0 });
    fireEvent.change(screen.getByLabelText('Agregar insumo'), { target: { value: 'pan' } });
    await waitFor(() => expect(screen.getByText('No se pudo buscar: revisa la conexión.')).toBeInTheDocument());

    inventoryClient.listInventory.mockResolvedValueOnce({ ok: true, data: { items: [] } });
    fireEvent.change(screen.getByLabelText('Agregar insumo'), { target: { value: 'xyz' } });
    await waitFor(() => expect(screen.getByText('Sin resultados para "xyz".')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Agregar insumo'), { target: { value: 'lomo' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Lomo fino (LOM-1)' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Lomo fino (LOM-1)' }));
    expect(screen.getByLabelText('Cantidad (kg)')).toHaveFocus();
  });

  it('M6: while processing, the focus stays inside the dialog', async () => {
    let resolveReceive;
    vi.spyOn(purchasesClient, 'receivePurchase').mockImplementation(() => new Promise((resolve) => { resolveReceive = resolve; }));
    await openDraft();
    fireEvent.click(screen.getByRole('button', { name: 'Recibir' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Recibir' }));

    const processing = within(dialog).getByRole('button', { name: 'Procesando...' });
    expect(processing).toHaveAttribute('aria-disabled', 'true');
    expect(processing).not.toBeDisabled();
    processing.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(within(dialog).getByRole('button', { name: 'Volver' })).toHaveFocus();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Volver' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    resolveReceive({ ok: true, data: { data: { ...draftPurchase, status: 'received' } } });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('M7: switching tabs keeps the new purchase form and what was written', async () => {
    render(<PurchasesView onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Nueva compra')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Nueva compra'));
    fireEvent.change(screen.getByLabelText('Factura (opcional)'), { target: { value: '001-002-77' } });

    fireEvent.click(screen.getByRole('tab', { name: 'Valor' }));
    expect(screen.getByRole('tab', { name: 'Valor' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'Compras' }));
    expect(screen.getByLabelText('Factura (opcional)')).toHaveValue('001-002-77');
  });
});
