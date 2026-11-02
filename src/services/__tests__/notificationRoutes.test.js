import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ALLOWED_SCREENS,
  sanitizeActionParams,
  resolveNotificationRoute,
} from '../notificationRoutes';
import { ABILITIES } from '../permissions';
import * as apiClient from '../apiClient';

describe('notificationRoutes security and routing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('ALLOWED_SCREENS whitelist', () => {
    it('contains strictly the permitted screens', () => {
      expect(ALLOWED_SCREENS.has('inventario')).toBe(true);
      expect(ALLOWED_SCREENS.has('pedido')).toBe(true);
      expect(ALLOWED_SCREENS.has('pedidos')).toBe(true);
      expect(ALLOWED_SCREENS.has('cierre_caja')).toBe(true);
      expect(ALLOWED_SCREENS.has('chat')).toBe(true);
      expect(ALLOWED_SCREENS.has('daily_close')).toBe(true);
      expect(ALLOWED_SCREENS.has('retiros')).toBe(true);
      expect(ALLOWED_SCREENS.has('withdrawals')).toBe(true);
      expect(ALLOWED_SCREENS.has('overtime')).toBe(true);
      expect(ALLOWED_SCREENS.has('horas_extra')).toBe(true);
      expect(ALLOWED_SCREENS.has('incidencia')).toBe(true);
      expect(ALLOWED_SCREENS.has('incidencias')).toBe(true);
      expect(ALLOWED_SCREENS.has('assets')).toBe(true);
      expect(ALLOWED_SCREENS.has('activos')).toBe(true);
      expect(ALLOWED_SCREENS.size).toBe(14);
    });
  });

  describe('sanitizeActionParams', () => {
    it('allows valid positive integer id', () => {
      expect(sanitizeActionParams({ id: 45 })).toEqual({ id: 45 });
      expect(sanitizeActionParams({ id: '12' })).toEqual({ id: 12 });
      expect(sanitizeActionParams({ id: -4 })).toEqual({});
      expect(sanitizeActionParams({ id: 'abc' })).toEqual({});
    });

    it('allows valid YYYY-MM-DD date and rejects malformed dates', () => {
      expect(sanitizeActionParams({ date: '2026-10-07' })).toEqual({ date: '2026-10-07' });
      expect(sanitizeActionParams({ date: '07-10-2026' })).toEqual({});
      expect(sanitizeActionParams({ date: '2026/10/07' })).toEqual({});
      expect(sanitizeActionParams({ date: 'invalid-date' })).toEqual({});
    });

    it('allows valid YYYY-MM month in mes or month', () => {
      expect(sanitizeActionParams({ mes: '2026-10' })).toEqual({ mes: '2026-10' });
      expect(sanitizeActionParams({ month: '2026-10' })).toEqual({ month: '2026-10' });
      expect(sanitizeActionParams({ mes: '2026-13' })).toEqual({});
    });

    it('allows valid subView in whitelist', () => {
      expect(sanitizeActionParams({ subView: 'daily_close' })).toEqual({ subView: 'daily_close' });
      expect(sanitizeActionParams({ subView: 'inventory' })).toEqual({ subView: 'inventory' });
      expect(sanitizeActionParams({ subView: 'withdrawals' })).toEqual({ subView: 'withdrawals' });
      expect(sanitizeActionParams({ subView: 'retiros' })).toEqual({ subView: 'withdrawals' });
      expect(sanitizeActionParams({ subView: 'overtime' })).toEqual({ subView: 'overtime' });
      expect(sanitizeActionParams({ subView: 'incidents' })).toEqual({ subView: 'incidents' });
      expect(sanitizeActionParams({ subView: 'assets' })).toEqual({ subView: 'assets' });
      expect(sanitizeActionParams({ subView: 'evil_subview' })).toEqual({});
    });

    it('never allows arbitrary URLs or script injections', () => {
      const sanitized = sanitizeActionParams({
        url: 'https://evil.com',
        redirect: 'javascript:alert(1)',
        html: '<script>alert(1)</script>',
        id: 9,
      });
      expect(sanitized).toEqual({ id: 9 });
      expect(sanitized.url).toBeUndefined();
      expect(sanitized.redirect).toBeUndefined();
    });
  });

  describe('resolveNotificationRoute', () => {
    it('rejects disallowed screens returning null', () => {
      expect(resolveNotificationRoute('external_url', {})).toBeNull();
      expect(resolveNotificationRoute('settings', {})).toBeNull();
      expect(resolveNotificationRoute('../../admin', {})).toBeNull();
    });

    it('resolves inventario to negocios tab with inventory subview', () => {
      const route = resolveNotificationRoute('inventario', { id: 15 });
      expect(route).toEqual({
        tab: 'negocios',
        subView: 'inventory',
        params: { id: 15 },
      });
    });

    it('resolves inventario with assets subView to assets screen (Brief 38p)', () => {
      const route = resolveNotificationRoute('inventario', { subView: 'assets', tab: 'count' });
      expect(route).toEqual({
        tab: 'negocios',
        subView: 'assets',
        params: { subView: 'assets', tab: 'count' },
      });
    });

    it('resolves assets and activos screens to assets subview (Brief 38p)', () => {
      expect(resolveNotificationRoute('assets', { tab: 'count' })).toEqual({
        tab: 'negocios',
        subView: 'assets',
        params: { tab: 'count' },
      });
      expect(resolveNotificationRoute('activos')).toEqual({
        tab: 'negocios',
        subView: 'assets',
        params: {},
      });
    });

    it('resolves incidencia screen with id to negocios incidents subview (Brief 37p)', () => {
      const route = resolveNotificationRoute('incidencia', { id: 42 });
      expect(route).toEqual({
        tab: 'negocios',
        subView: 'incidents',
        params: { id: 42 },
      });
      expect(resolveNotificationRoute('incidencias')).toEqual({
        tab: 'negocios',
        subView: 'incidents',
        params: {},
      });
    });

    it('resolves overtime and horas_extra to overtime screen (Brief 36p)', () => {
      expect(resolveNotificationRoute('overtime', { mes: '2026-10' })).toEqual({
        tab: 'negocios',
        subView: 'overtime',
        params: { mes: '2026-10' },
      });
      expect(resolveNotificationRoute('horas_extra')).toEqual({
        tab: 'negocios',
        subView: 'overtime',
        params: {},
      });
    });

    it('resolves daily_close screen directly to negocios daily_close', () => {
      const route = resolveNotificationRoute('daily_close', {});
      expect(route).toEqual({
        tab: 'negocios',
        subView: 'daily_close',
        params: {},
      });
    });

    it('resolves retiros and withdrawals to negocios withdrawals subview (Brief 32p)', () => {
      expect(resolveNotificationRoute('retiros', { id: 10 })).toEqual({
        tab: 'negocios',
        subView: 'withdrawals',
        params: { id: 10 },
      });
      expect(resolveNotificationRoute('withdrawals')).toEqual({
        tab: 'negocios',
        subView: 'withdrawals',
        params: {},
      });
    });

    it('resolves cierre_caja to cashclose subview for user with cash.review (owner or admin)', () => {
      const adminUser = {
        id: 1,
        capabilities: { abilities: [ABILITIES.CASH_REVIEW, ABILITIES.CASH_REGISTER] },
      };
      const route = resolveNotificationRoute('cierre_caja', { date: '2026-10-07' }, adminUser);
      expect(route).toEqual({
        tab: 'negocios',
        subView: 'cashclose',
        params: { date: '2026-10-07' },
      });
    });

    it('resolves cierre_caja to cash_declaration subview for lounge head (cash.register without cash.review) (Brief 35p)', () => {
      const loungeHeadUser = {
        id: 5,
        capabilities: { abilities: [ABILITIES.CASH_REGISTER] },
      };
      const route = resolveNotificationRoute('cierre_caja', { date: '2026-11-02' }, loungeHeadUser);
      expect(route).toEqual({
        tab: 'negocios',
        subView: 'cash_declaration',
        params: { date: '2026-11-02' },
      });
    });

    it('resolves cierre_caja using stored user if userContext is not passed', () => {
      vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
        id: 5,
        capabilities: { abilities: [ABILITIES.CASH_REGISTER] },
      });

      const route = resolveNotificationRoute('cierre_caja', { date: '2026-11-02' });
      expect(route).toEqual({
        tab: 'negocios',
        subView: 'cash_declaration',
        params: { date: '2026-11-02' },
      });
    });

    it('resolves pedidos and pedido to the Pedidos subview of Negocios (Brief 22p)', () => {
      expect(resolveNotificationRoute('pedidos')).toEqual({
        tab: 'negocios',
        subView: 'pedidos',
        params: {},
      });
      expect(resolveNotificationRoute('pedido', { id: 101 })).toEqual({
        tab: 'negocios',
        subView: 'pedidos',
        params: { id: 101 },
      });
    });

    it('resolves chat to asistente tab', () => {
      expect(resolveNotificationRoute('chat')).toEqual({
        tab: 'asistente',
        params: {},
      });
    });
  });
});
