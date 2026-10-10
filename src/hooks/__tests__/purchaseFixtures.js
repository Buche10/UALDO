/** Compra y proveedor de prueba con la forma de UaldoBusiness/docs/API-purchases.md. */

export const supplier = { id: 4, name: 'Carnes del Valle', tax_id: '1790012345001', contact_name: 'Ana', phone: '0991234567', email: null, notes: null, is_active: true };

export const draftPurchase = {
  id: 9,
  status: 'draft',
  supplier: { id: 4, name: 'Carnes del Valle' },
  location: 'warehouse',
  location_label: 'Bodega',
  purchased_on: '2026-10-09',
  invoice_number: '001-002-000123456',
  supply_request_id: null,
  notes: null,
  total_cents: 8760,
  total: 87.6,
  received_at: null,
  cancelled_at: null,
  lines: [
    { id: 1, item_id: 31, item_name: 'Lomo fino', unit: 'kg', quantity: 5, line_total_cents: 7500, line_total: 75, unit_cost: 15, note: null },
    { id: 2, item_id: 47, item_name: 'Arroz', unit: 'kg', quantity: 10.5, line_total_cents: 1260, line_total: 12.6, unit_cost: 1.2, note: 'Saco' },
  ],
};

export const inventoryItems = [
  { id: 31, name: 'Lomo fino', code: 'LOM-1', unit: 'kg', type: 'supply' },
  { id: 50, name: 'Lavado de manteles', unit: 'unit', type: 'service' },
];

export const pageOf = (data, current = 1, last = 1) => ({ ok: true, data: { data, meta: { current_page: current, last_page: last } } });
