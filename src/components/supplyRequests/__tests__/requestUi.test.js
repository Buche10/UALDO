import { describe, it, expect } from 'vitest';
import {
  quantityWithUnit,
  formatRelativeTime,
  statusLabel,
  requesterName,
  formatDateTime
} from '../requestUi';

describe('requestUi utilities', () => {
  describe('quantityWithUnit', () => {
    it('devuelve "Cantidad por definir" para null, undefined o cadena vacía', () => {
      expect(quantityWithUnit(null, 'kg')).toBe('Cantidad por definir');
      expect(quantityWithUnit(undefined, 'litro')).toBe('Cantidad por definir');
      expect(quantityWithUnit('', 'unidad')).toBe('Cantidad por definir');
      expect(quantityWithUnit(null)).toBe('Cantidad por definir');
    });

    it('formatea cantidades válidas con su unidad', () => {
      expect(quantityWithUnit(5, 'kg')).toBe('5 kg');
      expect(quantityWithUnit('2.5', 'litros')).toBe('2,5 litros');
      expect(quantityWithUnit(10)).toBe('10');
    });
  });

  describe('formatRelativeTime', () => {
    it('formatea fechas de hoy con prefijo "hoy HH:MM"', () => {
      const now = new Date();
      now.setHours(21, 40, 0, 0);
      const res = formatRelativeTime(now.toISOString());
      expect(res).toContain('hoy');
      expect(res).toMatch(/hoy \d{2}:\d{2}/);
    });

    it('formatea fechas de ayer con prefijo "ayer HH:MM"', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(22, 5, 0, 0);
      const res = formatRelativeTime(yesterday.toISOString());
      expect(res).toContain('ayer');
      expect(res).toMatch(/ayer \d{2}:\d{2}/);
    });

    it('devuelve cadena vacía para valores nulos o inválidos', () => {
      expect(formatRelativeTime(null)).toBe('');
      expect(formatRelativeTime('')).toBe('');
      expect(formatRelativeTime('fecha-invalida')).toBe('');
    });
  });

  describe('requesterName', () => {
    it('usa requester_first_name si está presente', () => {
      expect(requesterName({ requester_first_name: 'Carlos' })).toBe('Carlos');
    });

    it('extrae el primer nombre del objeto requester', () => {
      expect(requesterName({ requester: { name: 'María López' } })).toBe('María');
    });

    it('devuelve "Personal" como fallback', () => {
      expect(requesterName({})).toBe('Personal');
    });
  });
});
