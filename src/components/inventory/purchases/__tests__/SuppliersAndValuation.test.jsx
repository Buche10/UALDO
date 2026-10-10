import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PurchasesView from '../PurchasesView';
import * as purchasesClient from '../../../../services/purchasesClient';
import { draftPurchase, pageOf, supplier } from '../../../../hooks/__tests__/purchaseFixtures';

describe('Suppliers tab', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(purchasesClient, 'listPurchases').mockResolvedValue(pageOf([draftPurchase]));
    vi.spyOn(purchasesClient, 'listSuppliers').mockResolvedValue(pageOf([supplier, { ...supplier, id: 5, name: 'Viejo proveedor', is_active: false, tax_id: null, contact_name: null, phone: null }], 1, 2));
  });

  it('lists, searches and includes inactive suppliers', async () => {
    render(<PurchasesView onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Proveedores' }));
    await waitFor(() => expect(screen.getByText('Carnes del Valle')).toBeInTheDocument());
    expect(screen.getByText('1790012345001, Ana, 0991234567')).toBeInTheDocument();
    expect(screen.getByText('Viejo proveedor (inactivo)')).toBeInTheDocument();
    expect(screen.getByText('Sin datos de contacto')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Incluir inactivos'));
    await waitFor(() => expect(purchasesClient.listSuppliers).toHaveBeenLastCalledWith({ search: '', includeInactive: true, page: 1 }));
    fireEvent.change(screen.getByLabelText('Buscar proveedor'), { target: { value: 'carnes' } });
    await waitFor(() => expect(purchasesClient.listSuppliers).toHaveBeenLastCalledWith({ search: 'carnes', includeInactive: true, page: 1 }), { timeout: 2000 });
    fireEvent.click(screen.getByText('Cargar más'));
    await waitFor(() => expect(purchasesClient.listSuppliers).toHaveBeenLastCalledWith({ search: 'carnes', includeInactive: true, page: 2 }));
  });

  it('creates a supplier and shows the duplicate name error next to the name', async () => {
    const create = vi.spyOn(purchasesClient, 'createSupplier')
      .mockResolvedValueOnce({ ok: false, status: 422, data: { message: 'Datos inválidos.', errors: { name: ['Ya existe un proveedor con ese nombre.'] } } })
      .mockResolvedValueOnce({ ok: true, status: 201, data: { data: { ...supplier, id: 8, name: 'Lácteos Andinos' } } });
    render(<PurchasesView onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Proveedores' }));
    await waitFor(() => expect(screen.getByText('Nuevo proveedor')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Nuevo proveedor'));

    expect(screen.queryByText(/Activo/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'carnes del valle' } });
    fireEvent.click(screen.getByText('Guardar proveedor'));
    await waitFor(() => expect(screen.getByText('Ya existe un proveedor con ese nombre.')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Lácteos Andinos' } });
    fireEvent.change(screen.getByLabelText('Notas (opcional)'), { target: { value: 'Entrega martes' } });
    fireEvent.click(screen.getByText('Guardar proveedor'));
    await waitFor(() => expect(screen.getByText('Lácteos Andinos')).toBeInTheDocument());
    expect(create.mock.calls[1][0]).toEqual(expect.objectContaining({ name: 'Lácteos Andinos', notes: 'Entrega martes', is_active: true }));
  });

  it('edits and deactivates a supplier', async () => {
    const update = vi.spyOn(purchasesClient, 'updateSupplier').mockResolvedValue({ ok: true, data: { data: { ...supplier, is_active: false } } });
    render(<PurchasesView onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Proveedores' }));
    await waitFor(() => expect(screen.getByText('Carnes del Valle')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Carnes del Valle'));

    expect(screen.getByLabelText('Nombre')).toHaveValue('Carnes del Valle');
    fireEvent.click(screen.getByRole('switch', { name: /Activo/ }));
    fireEvent.click(screen.getByText('Guardar proveedor'));
    await waitFor(() => expect(update).toHaveBeenCalledWith(4, expect.objectContaining({ is_active: false })));
    await waitFor(() => expect(screen.getByText('Carnes del Valle (inactivo)')).toBeInTheDocument());
  });
});

describe('Valuation tab', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(purchasesClient, 'listPurchases').mockResolvedValue(pageOf([]));
  });

  it('shows the total, each location and the warning of items without cost', async () => {
    vi.spyOn(purchasesClient, 'getValuation').mockResolvedValue({
      ok: true,
      data: {
        by_location: { warehouse: { label: 'Bodega', total: 87.6 }, kitchen: { label: 'Cocina', total: 0 }, lounge: { label: 'Salón', total: 0 } },
        total: 87.6,
        items_without_cost: 3,
      },
    });
    render(<PurchasesView onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Valor' }));
    await waitFor(() => expect(screen.getByText('Valor total del inventario')).toBeInTheDocument());
    expect(screen.getAllByText('USD 87,60')).toHaveLength(2);
    expect(screen.getByText('Salón')).toBeInTheDocument();
    expect(screen.getByText(/Hay 3 insumos con stock sin costo/)).toBeInTheDocument();
  });

  it('explains one item without cost, hides the warning at 0 and retries after an error', async () => {
    const spy = vi.spyOn(purchasesClient, 'getValuation')
      .mockResolvedValueOnce({ ok: false, status: 500, error: 'Error 500' })
      .mockResolvedValueOnce({ ok: true, data: { by_location: {}, total: null, items_without_cost: 1 } });
    const { unmount } = render(<PurchasesView onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Valor' }));
    await waitFor(() => expect(screen.getByText('Error 500')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Reintentar'));
    await waitFor(() => expect(screen.getByText(/Hay 1 insumo con stock sin costo/)).toBeInTheDocument());
    expect(screen.getAllByText('Sin dato').length).toBeGreaterThan(0);
    unmount();

    spy.mockResolvedValue({ ok: true, data: { by_location: {}, total: 0, items_without_cost: 0 } });
    render(<PurchasesView onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Valor' }));
    await waitFor(() => expect(screen.getByText('Valor total del inventario')).toBeInTheDocument());
    expect(screen.queryByText(/sin costo/)).not.toBeInTheDocument();
  });

  it('goes back to inventory', () => {
    const onBack = vi.fn();
    render(<PurchasesView onBack={onBack} />);
    fireEvent.click(screen.getByText('Inventario'));
    expect(onBack).toHaveBeenCalled();
  });
});
