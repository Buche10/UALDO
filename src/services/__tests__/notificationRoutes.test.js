import { describe, it, expect } from 'vitest';
import {
  ALLOWED_SCREENS,
  sanitizeActionParams,
  resolveNotificationRoute,
} from '../notificationRoutes';

describe('notificationRoutes security and routing', () => {
  describe('ALLOWED_SCREENS whitelist', () => {
    it('contains strictly the permitted screens', () => {
      expect(ALLOWED_SCREENS.has('inventario')).toBe(true);
      expect(ALLOWED_SCREENS.has('pedido')).toBe(true);
      expect(ALLOWED_SCREENS.has('pedidos')).toBe(true);
      expect(ALLOWED_SCREENS.has('cierre_caja')).toBe(true);
      expect(ALLOWED_SCREENS.has('chat')).toBe(true);
      expect(ALLOWED_SCREENS.size).toBe(5);
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

    it('resolves cierre_caja to negocios tab with cashclose subview', () => {
      const route = resolveNotificationRoute('cierre_caja', { date: '2026-10-07' });
      expect(route).toEqual({
        tab: 'negocios',
        subView: 'cashclose',
        params: { date: '2026-10-07' },
      });
    });

    it('resolves pedidos and pedido to asistente tab', () => {
      expect(resolveNotificationRoute('pedidos')).toEqual({
        tab: 'asistente',
        params: {},
      });
      expect(resolveNotificationRoute('pedido', { id: 101 })).toEqual({
        tab: 'asistente',
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
