/** Ficha y producción de prueba con la forma de UaldoBusiness/docs/API-production.md. */

export const lomoTemplate = {
  id: 3,
  code: 'FDP-001',
  name: 'Lomo porcionado',
  expected_yield_pct: 70,
  default_location: 'kitchen',
  requires_weight_control: true,
  requires_waste_record: true,
  allow_real_output_adjustment: true,
  inputs: [{ item_id: 1, item_name: 'Lomo Fino Kg', unit: 'kg', quantity: 1, is_primary: true }],
  outputs: [
    { item_id: 2, item_name: 'Lomo Fino Unidad', unit: 'unit', quantity: 2, is_main: true, is_by_product: false },
    { item_id: 3, item_name: 'Filete De Res', unit: 'unit', quantity: 2, is_main: false, is_by_product: true },
    { item_id: 4, item_name: 'Merma de lomo', unit: 'kg', quantity: 0.23, is_main: false, is_by_product: false },
  ],
};

export const burgerTemplate = {
  id: 8,
  code: 'FDP-008',
  name: 'Carne Hamburguesas',
  expected_yield_pct: 100,
  default_location: 'kitchen',
  requires_weight_control: false,
  requires_waste_record: false,
  allow_real_output_adjustment: true,
  inputs: [
    { item_id: 4, item_name: 'Merma de lomo', unit: 'kg', quantity: 1, is_primary: false },
    { item_id: 5, item_name: 'Merma Premium', unit: 'kg', quantity: 1, is_primary: false },
  ],
  outputs: [{ item_id: 6, item_name: 'Carne De Hamburguesa', unit: 'unit', quantity: 30, is_main: true, is_by_product: false }],
};

export const recordedRun = {
  id: 41,
  template_id: 3,
  template_name: 'Lomo porcionado',
  status: 'completed',
  location: 'kitchen',
  location_label: 'Cocina',
  input_weight: 4,
  main_output_weight: 2.4,
  byproduct_weight: 0.9,
  waste_quantity: 0.65,
  expected_yield_pct: 70,
  real_yield_pct: 60,
  yield_difference_pct: -10,
  unaccounted_weight: 0.05,
  unaccounted_pct: 1.25,
  notes: null,
  created_at: '2026-10-09T15:30:00-05:00',
  voided_at: null,
  void_reason: null,
  lines: [
    { id: 1, item_id: 1, item_name: 'Lomo Fino Kg', direction: 'input', is_main: false, quantity: 4, expected_quantity: 4, unit: 'kg' },
    { id: 2, item_id: 2, item_name: 'Lomo Fino Unidad', direction: 'output', is_main: true, quantity: 8, expected_quantity: 8, unit: 'unit' },
  ],
};

export const ownerCosts = {
  cost_status: 'complete',
  input_cost_cents: 8000,
  input_cost: 80,
};
