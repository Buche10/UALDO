import { describe, it, expect } from 'vitest';
import { normalizeAmount, formatUsd } from '../money';

describe('money service', () => {
  describe('normalizeAmount', () => {
    it('normaliza coma decimal a punto y devuelve string', () => {
      expect(normalizeAmount('12,5')).toBe('12.5');
      expect(normalizeAmount('12.50')).toBe('12.50');
      expect(normalizeAmount('100')).toBe('100');
    });

    it('devuelve null para montos invalidos con 3 decimales, negativos o no numericos', () => {
      expect(normalizeAmount('1.234')).toBeNull();
      expect(normalizeAmount('-3')).toBeNull();
      expect(normalizeAmount('abc')).toBeNull();
      expect(normalizeAmount('')).toBeNull();
      expect(normalizeAmount(null)).toBeNull();
      expect(normalizeAmount(undefined)).toBeNull();
    });

    it('para movimientos rechaza 0 y montos mayores a 100000', () => {
      expect(normalizeAmount('0', true)).toBeNull();
      expect(normalizeAmount('0.00', true)).toBeNull();
      expect(normalizeAmount('100001', true)).toBeNull();
      expect(normalizeAmount('100000', true)).toBe('100000');
      expect(normalizeAmount('0.01', true)).toBe('0.01');
      expect(normalizeAmount('45.2', { isMovement: true })).toBe('45.2');
    });
  });

  describe('formatUsd', () => {
    it('devuelve Pendiente para valores null o undefined', () => {
      expect(formatUsd(null)).toBe('Pendiente');
      expect(formatUsd(undefined)).toBe('Pendiente');
      expect(formatUsd('no-numeric')).toBe('Pendiente');
    });

    it('formatea montos numericos con separador es-EC y prefijo USD', () => {
      expect(formatUsd(1234.56)).toBe('USD 1.234,56');
      expect(formatUsd(0)).toBe('USD 0,00');
      expect(formatUsd(-12.4)).toBe('USD -12,40');
    });
  });
});
