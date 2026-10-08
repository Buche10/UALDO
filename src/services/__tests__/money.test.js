import { describe, it, expect } from 'vitest';
import { normalizeAmount, formatUsd, percentToBp, bpToPercent } from '../money';

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

  describe('percentToBp', () => {
    it('convierte porcentajes validos a enteros en puntos basicos', () => {
      expect(percentToBp('4,48')).toBe(448);
      expect(percentToBp('4.48')).toBe(448);
      expect(percentToBp('2')).toBe(200);
      expect(percentToBp('0,5')).toBe(50);
      expect(percentToBp('30')).toBe(3000);
      expect(percentToBp('0')).toBe(0);
      expect(Number.isInteger(percentToBp('4,48'))).toBe(true);
    });

    it('devuelve null para valores invalidos, fuera de rango o con decimales excesivos', () => {
      expect(percentToBp('30,01')).toBeNull();
      expect(percentToBp('-1')).toBeNull();
      expect(percentToBp('4,485')).toBeNull();
      expect(percentToBp('abc')).toBeNull();
      expect(percentToBp('')).toBeNull();
      expect(percentToBp(null)).toBeNull();
      expect(percentToBp(undefined)).toBeNull();
    });
  });

  describe('bpToPercent', () => {
    it('formatea puntos basicos a porcentaje visual con coma decimal', () => {
      expect(bpToPercent(448)).toBe('4,48 %');
      expect(bpToPercent(200)).toBe('2,00 %');
      expect(bpToPercent(0)).toBe('0,00 %');
      expect(bpToPercent(3000)).toBe('30,00 %');
    });

    it('devuelve Sin tasa para valores nulos, indefinidos o invalidos', () => {
      expect(bpToPercent(null)).toBe('Sin tasa');
      expect(bpToPercent(undefined)).toBe('Sin tasa');
      expect(bpToPercent(-10)).toBe('Sin tasa');
      expect(bpToPercent('448')).toBe('Sin tasa');
    });
  });
});
