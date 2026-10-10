import { describe, it, expect } from 'vitest';
import { formatQuantity } from '../quantityFormat';

describe('formatQuantity utility', () => {
  it('returns "Sin dato" for null, undefined, empty string or NaN', () => {
    expect(formatQuantity(null)).toBe('Sin dato');
    expect(formatQuantity(undefined)).toBe('Sin dato');
    expect(formatQuantity('')).toBe('Sin dato');
    expect(formatQuantity('no-un-numero')).toBe('Sin dato');
  });

  it('formats zero correctly as "0"', () => {
    expect(formatQuantity(0)).toBe('0');
    expect(formatQuantity('0')).toBe('0');
  });

  it('formats decimal numbers in es-EC without trailing zeros up to 3 decimals', () => {
    expect(formatQuantity(1.5)).toBe('1,5');
    expect(formatQuantity(2.25)).toBe('2,25');
    expect(formatQuantity(3.125)).toBe('3,125');
    expect(formatQuantity('4.500')).toBe('4,5');
    expect(formatQuantity('4,500')).toBe('4,5');
    expect(formatQuantity(10)).toBe('10');
  });
});
