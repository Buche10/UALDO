import { describe, it, expect } from 'vitest';
import {
  ABILITIES,
  ROLES,
  ROLE_LABELS,
  AREA_LABELS,
  can,
  canAny,
  roleLabel,
  userArea,
} from '../permissions';

describe('permissions service (Brief 30p)', () => {
  it('contiene los 33 permisos congelados del Brief 30', () => {
    expect(Object.isFrozen(ABILITIES)).toBe(true);
    expect(Object.keys(ABILITIES)).toHaveLength(33);
    expect(ABILITIES.TEAM_MANAGE).toBe('team.manage');
    expect(ABILITIES.SETTINGS_MANAGE).toBe('settings.manage');
    expect(ABILITIES.SUPPLY_REQUEST).toBe('supply.request');
    expect(ABILITIES.SUPPLY_DECIDE).toBe('supply.decide');
    expect(ABILITIES.PURCHASES_MANAGE).toBe('purchases.manage');
    expect(ABILITIES.PURCHASES_RECEIVE).toBe('purchases.receive');
    expect(ABILITIES.INVENTORY_VIEW).toBe('inventory.view');
    expect(ABILITIES.INVENTORY_MOVE).toBe('inventory.move');
    expect(ABILITIES.INVENTORY_COUNT_WAREHOUSE).toBe('inventory.count.warehouse');
    expect(ABILITIES.INVENTORY_COUNT_KITCHEN).toBe('inventory.count.kitchen');
    expect(ABILITIES.INVENTORY_COUNT_LOUNGE).toBe('inventory.count.lounge');
    expect(ABILITIES.INVENTORY_VALIDATE_KITCHEN).toBe('inventory.validate.kitchen');
    expect(ABILITIES.INVENTORY_VALIDATE_LOUNGE).toBe('inventory.validate.lounge');
    expect(ABILITIES.INVENTORY_ADJUST).toBe('inventory.adjust');
    expect(ABILITIES.INVENTORY_COSTS).toBe('inventory.costs');
    expect(ABILITIES.WITHDRAWALS_DECLARE).toBe('withdrawals.declare');
    expect(ABILITIES.WITHDRAWALS_SUPERVISE).toBe('withdrawals.supervise');
    expect(ABILITIES.PRODUCTION_REGISTER).toBe('production.register');
    expect(ABILITIES.CASH_REGISTER).toBe('cash.register');
    expect(ABILITIES.CASH_REVIEW).toBe('cash.review');
    expect(ABILITIES.SALES_TOTALS).toBe('sales.totals');
    expect(ABILITIES.OVERTIME_REGISTER_KITCHEN).toBe('overtime.register.kitchen');
    expect(ABILITIES.OVERTIME_REGISTER_LOUNGE).toBe('overtime.register.lounge');
    expect(ABILITIES.OVERTIME_REPORT).toBe('overtime.report');
    expect(ABILITIES.INCIDENTS_REPORT).toBe('incidents.report');
    expect(ABILITIES.INCIDENTS_MANAGE).toBe('incidents.manage');
    expect(ABILITIES.ASSETS_COUNT_KITCHEN).toBe('assets.count.kitchen');
    expect(ABILITIES.ASSETS_COUNT_LOUNGE).toBe('assets.count.lounge');
    expect(ABILITIES.ASSETS_VALIDATE_KITCHEN).toBe('assets.validate.kitchen');
    expect(ABILITIES.ASSETS_VALIDATE_LOUNGE).toBe('assets.validate.lounge');
    expect(ABILITIES.RESERVATIONS_VIEW).toBe('reservations.view');
    expect(ABILITIES.RESERVATIONS_MANAGE).toBe('reservations.manage');
    expect(ABILITIES.LOTS_MANAGE).toBe('lots.manage');
  });

  describe('can() con capabilities.abilities', () => {
    it('devuelve true si el permiso está presente en abilities', () => {
      const user = {
        id: 10,
        capabilities: {
          abilities: [ABILITIES.CASH_REVIEW, ABILITIES.SALES_TOTALS],
        },
      };

      expect(can(user, ABILITIES.CASH_REVIEW)).toBe(true);
      expect(can(user, ABILITIES.SALES_TOTALS)).toBe(true);
      expect(can(user, ABILITIES.TEAM_MANAGE)).toBe(false);
    });

    it('devuelve false ante usuario nulo o ability indefinida', () => {
      expect(can(null, ABILITIES.CASH_REVIEW)).toBe(false);
      expect(can(undefined, ABILITIES.CASH_REVIEW)).toBe(false);
      expect(can({ capabilities: { abilities: [] } }, null)).toBe(false);
    });
  });

  describe('can() con respaldo motor viejo (sin abilities)', () => {
    it('el dueño con is_owner: true puede hacer todo', () => {
      const legacyOwner = {
        id: 1,
        role: 'owner',
        capabilities: { is_owner: true },
      };

      expect(can(legacyOwner, ABILITIES.TEAM_MANAGE)).toBe(true);
      expect(can(legacyOwner, ABILITIES.SETTINGS_MANAGE)).toBe(true);
      expect(can(legacyOwner, ABILITIES.SALES_TOTALS)).toBe(true);
      expect(can(legacyOwner, ABILITIES.LOTS_MANAGE)).toBe(true);
    });

    it('el dueño identificado solo por role: owner puede hacer todo', () => {
      const legacyOwner = { id: 1, role: 'owner' };
      expect(can(legacyOwner, ABILITIES.SALES_TOTALS)).toBe(true);
    });

    it('el personal con is_owner: false solo puede los 4 permisos basicos', () => {
      const legacyStaff = {
        id: 5,
        role: 'staff',
        capabilities: { is_owner: false },
      };

      expect(can(legacyStaff, ABILITIES.SUPPLY_REQUEST)).toBe(true);
      expect(can(legacyStaff, ABILITIES.INVENTORY_VIEW)).toBe(true);
      expect(can(legacyStaff, ABILITIES.INVENTORY_MOVE)).toBe(true);
      expect(can(legacyStaff, ABILITIES.WITHDRAWALS_DECLARE)).toBe(true);

      // No puede lo demas
      expect(can(legacyStaff, ABILITIES.SUPPLY_DECIDE)).toBe(false);
      expect(can(legacyStaff, ABILITIES.SALES_TOTALS)).toBe(false);
      expect(can(legacyStaff, ABILITIES.CASH_REVIEW)).toBe(false);
      expect(can(legacyStaff, ABILITIES.TEAM_MANAGE)).toBe(false);
    });
  });

  describe('canAny()', () => {
    it('devuelve true si al menos una habilidad es permitida', () => {
      const user = {
        capabilities: { abilities: [ABILITIES.INVENTORY_VIEW] },
      };
      expect(canAny(user, [ABILITIES.CASH_REVIEW, ABILITIES.INVENTORY_VIEW])).toBe(true);
      expect(canAny(user, [ABILITIES.CASH_REVIEW, ABILITIES.SALES_TOTALS])).toBe(false);
      expect(canAny(user, [])).toBe(false);
      expect(canAny(user, null)).toBe(false);
    });
  });

  describe('roleLabel() y userArea()', () => {
    it('respeta role_label enviado por el motor en capabilities', () => {
      const user = { capabilities: { role_label: 'Jefe de barra' } };
      expect(roleLabel(user)).toBe('Jefe de barra');
    });

    it('devuelve la etiqueta del rol segun la matriz si no viene role_label', () => {
      expect(roleLabel({ capabilities: { role: ROLES.OWNER } })).toBe('Dueño');
      expect(roleLabel({ capabilities: { role: ROLES.ADMIN } })).toBe('Administración');
      expect(roleLabel({ capabilities: { role: ROLES.KITCHEN_HEAD } })).toBe('Jefe de cocina');
      expect(roleLabel({ capabilities: { role: ROLES.LOUNGE_HEAD } })).toBe('Jefe de salón');
      expect(roleLabel({ capabilities: { role: ROLES.KITCHEN_STAFF } })).toBe('Cocina');
      expect(roleLabel({ capabilities: { role: ROLES.LOUNGE_STAFF } })).toBe('Salón');
      expect(roleLabel({ capabilities: { role: ROLES.STAFF } })).toBe('Personal sin área');
      expect(roleLabel({ role: 'unknown' })).toBe('Personal');
    });

    it('extrae el area correctamente', () => {
      expect(userArea({ capabilities: { area: 'kitchen' } })).toBe('kitchen');
      expect(userArea({ capabilities: { role: ROLES.LOUNGE_HEAD } })).toBe('lounge');
      expect(userArea({ capabilities: { role: ROLES.ADMIN } })).toBe(null);
    });
  });
});
