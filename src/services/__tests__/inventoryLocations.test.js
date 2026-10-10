import { describe, it, expect } from 'vitest';
import {
  INVENTORY_LOCATIONS,
  DEFAULT_LOCATION,
  isValidLocation,
  locationLabel,
} from '../inventoryLocations';

describe('inventoryLocations service', () => {
  it('defines canonical inventory locations with Spanish labels and correct keys', () => {
    expect(INVENTORY_LOCATIONS).toEqual([
      { value: 'warehouse', label: 'Bodega' },
      { value: 'kitchen', label: 'Cocina' },
      { value: 'lounge', label: 'Salón' },
    ]);
    expect(DEFAULT_LOCATION).toBe('kitchen');
  });

  it('validates canonical location values correctly', () => {
    expect(isValidLocation('warehouse')).toBe(true);
    expect(isValidLocation('kitchen')).toBe(true);
    expect(isValidLocation('lounge')).toBe(true);

    expect(isValidLocation('warehouse ')).toBe(true);
    expect(isValidLocation(' kitchen ')).toBe(true);

    expect(isValidLocation('bodega')).toBe(false);
    expect(isValidLocation('salon')).toBe(false);
    expect(isValidLocation('patio')).toBe(false);
    expect(isValidLocation('')).toBe(false);
    expect(isValidLocation(null)).toBe(false);
    expect(isValidLocation(undefined)).toBe(false);
    expect(isValidLocation(123)).toBe(false);
  });

  it('resolves location label in Spanish or falls back to "Sin ubicación"', () => {
    expect(locationLabel('warehouse')).toBe('Bodega');
    expect(locationLabel('kitchen')).toBe('Cocina');
    expect(locationLabel('lounge')).toBe('Salón');

    expect(locationLabel(null)).toBe('Sin ubicación');
    expect(locationLabel(undefined)).toBe('Sin ubicación');
    expect(locationLabel('')).toBe('Sin ubicación');
    expect(locationLabel('desconocido')).toBe('Sin ubicación');
    expect(locationLabel('bodega')).toBe('Sin ubicación');
  });
});
