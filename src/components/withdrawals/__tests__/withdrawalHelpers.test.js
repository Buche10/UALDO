import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getLocationLabel,
  getFirstName,
  getWithdrawalStatusBadge,
  getCancelCapability,
  countMyPendingWithdrawals,
} from '../withdrawalHelpers';
import { ABILITIES } from '../../../services/permissions';

describe('withdrawalHelpers (Brief 32p & 32p_fix)', () => {
  describe('getLocationLabel', () => {
    it('traduce ubicaciones conocidas', () => {
      expect(getLocationLabel('kitchen')).toBe('Cocina');
      expect(getLocationLabel('lounge')).toBe('Salón');
      expect(getLocationLabel('warehouse')).toBe('Bodega');
      expect(getLocationLabel('bar')).toBe('bar');
      expect(getLocationLabel('')).toBe('Área');
      expect(getLocationLabel(null)).toBe('Área');
    });
  });

  describe('getFirstName', () => {
    it('obtiene el primer nombre correctamente', () => {
      expect(getFirstName('Carlos Buch')).toBe('Carlos');
      expect(getFirstName('Ana')).toBe('Ana');
      expect(getFirstName('   María José  ')).toBe('María');
      expect(getFirstName('')).toBe('Alguien');
      expect(getFirstName(null)).toBe('Alguien');
    });
  });

  describe('getWithdrawalStatusBadge', () => {
    it('devuelve estilos y textos correctos por estado', () => {
      expect(getWithdrawalStatusBadge('open').text).toBe('Abierto');
      expect(getWithdrawalStatusBadge('escalated').text).toBe('Escalado');
      expect(getWithdrawalStatusBadge('closed').text).toBe('Cerrado');
      expect(getWithdrawalStatusBadge('cancelled').text).toBe('Cancelado');
      expect(getWithdrawalStatusBadge('other').text).toBe('other');
    });
  });

  describe('getCancelCapability', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('devuelve canCancel: false si el retiro o usuario no existen o no está open', () => {
      expect(getCancelCapability(null, { id: 1 })).toEqual({
        canCancel: false,
        remainingMinutes: 0,
        requiresNote: false,
        isAuthor: false,
      });

      expect(getCancelCapability({ status: 'closed' }, { id: 1 })).toEqual({
        canCancel: false,
        remainingMinutes: 0,
        requiresNote: false,
        isAuthor: false,
      });
    });

    it('el autor dentro de los primeros 15 minutos puede cancelar sin nota', () => {
      const withdrawal = {
        id: 10,
        user_id: 5,
        status: 'open',
        created_at: new Date('2026-11-01T11:50:00Z').toISOString(), // hace 10 min
      };
      const user = { id: 5, capabilities: { abilities: [] } };

      const cap = getCancelCapability(withdrawal, user);
      expect(cap.canCancel).toBe(true);
      expect(cap.isAuthor).toBe(true);
      expect(cap.requiresNote).toBe(false);
      expect(cap.remainingMinutes).toBe(5);
    });

    it('el autor después de 15 minutos no puede cancelar si no es supervisor', () => {
      const withdrawal = {
        id: 10,
        user_id: 5,
        status: 'open',
        created_at: new Date('2026-11-01T11:40:00Z').toISOString(), // hace 20 min
      };
      const user = { id: 5, capabilities: { abilities: [] } };

      const cap = getCancelCapability(withdrawal, user);
      expect(cap.canCancel).toBe(false);
      expect(cap.isAuthor).toBe(true);
      expect(cap.remainingMinutes).toBe(0);
    });

    it('un supervisor después de 15 minutos puede cancelar con nota obligatoria', () => {
      const withdrawal = {
        id: 10,
        user_id: 99,
        status: 'open',
        created_at: new Date('2026-11-01T11:40:00Z').toISOString(), // hace 20 min
      };
      const supervisor = {
        id: 2,
        capabilities: {
          abilities: [ABILITIES.WITHDRAWALS_SUPERVISE],
        },
      };

      const cap = getCancelCapability(withdrawal, supervisor);
      expect(cap.canCancel).toBe(true);
      expect(cap.requiresNote).toBe(true);
      expect(cap.isAuthor).toBe(false);
    });

    it('un supervisor dentro de 15 minutos puede cancelar sin nota obligatoria', () => {
      const withdrawal = {
        id: 10,
        user_id: 99,
        status: 'open',
        created_at: new Date('2026-11-01T11:55:00Z').toISOString(), // hace 5 min
      };
      const supervisor = {
        id: 2,
        capabilities: {
          abilities: [ABILITIES.WITHDRAWALS_SUPERVISE],
        },
      };

      const cap = getCancelCapability(withdrawal, supervisor);
      expect(cap.canCancel).toBe(true);
      expect(cap.requiresNote).toBe(false);
    });
  });

  describe('countMyPendingWithdrawals', () => {
    it('cuenta únicamente retiros propios en estado open o escalated', () => {
      const list = [
        { id: 1, user_id: 5, status: 'open' },
        { id: 2, user: { id: 5 }, status: 'escalated' },
        { id: 3, user_id: 5, status: 'closed' },
        { id: 4, user_id: 5, status: 'cancelled' },
        { id: 5, user_id: 99, status: 'open' },
        { id: 6, user: { id: 88 }, status: 'escalated' },
      ];

      expect(countMyPendingWithdrawals(list, 5)).toBe(2);
      expect(countMyPendingWithdrawals(list, 99)).toBe(1);
      expect(countMyPendingWithdrawals(list, 100)).toBe(0);
      expect(countMyPendingWithdrawals([], 5)).toBe(0);
      expect(countMyPendingWithdrawals(null, 5)).toBe(0);
      expect(countMyPendingWithdrawals(list, null)).toBe(0);
    });
  });
});
