/** Pedido de prueba con la forma de UaldoBusiness/docs/API-supply-requests.md. */

export const pendingRequest = {
  id: 101,
  status: 'pending',
  priority: 'urgent',
  note: 'Para el turno de la noche',
  requested_by: 12,
  requester: { id: 12, name: 'Rosa Elena Cocina' },
  decision_note: null,
  created_at: '2026-10-10T14:30:00+00:00',
  items: [
    { id: 201, inventory_item_id: 42, free_text_name: null, name: 'Aceite Vegetal', quantity: 5, unit: 'litro', note: 'Marca habitual' },
    { id: 202, inventory_item_id: null, free_text_name: 'Esponjas verdes', name: 'Esponjas verdes', quantity: 10, unit: 'unidad', note: null },
  ],
};

export const catalogItems = [
  { id: 42, name: 'Aceite Vegetal', code: 'ACE-1', unit: 'litro', type: 'supply' },
  { id: 50, name: 'Lavado de manteles', unit: 'unit', type: 'service' },
];

export const shoppingList = [
  { inventory_item_id: 42, name: 'Aceite Vegetal', quantity: 10, unit: 'litro', stock: 2, min_stock: 5, requests_count: 2, has_urgent: true },
  { inventory_item_id: null, name: 'Servilletas de papel', quantity: 20, unit: 'paquete', stock: null, min_stock: null, requests_count: 1, has_urgent: false },
];
