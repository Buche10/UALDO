import { describe, it, expect } from 'vitest';
import { canCountLocation, canValidateLocation } from '../dailyClosePermissions';
import { ABILITIES } from '../../../../services/permissions';

describe('dailyClosePermissions (Brief 31p / 31p_fix)', () => {
  const makeUser = (abilities = []) => ({
    id: 1,
    capabilities: { abilities },
  });

  describe('canCountLocation', () => {
    it('retorna false para usuario nulo o ubicación desconocida', () => {
      expect(canCountLocation(null, 'kitchen')).toBe(false);
      expect(canCountLocation(makeUser([ABILITIES.INVENTORY_COUNT_KITCHEN]), 'invalid')).toBe(false);
    });

    it('verifica permisos específicos por área', () => {
      const kitchenUser = makeUser([ABILITIES.INVENTORY_COUNT_KITCHEN]);
      expect(canCountLocation(kitchenUser, 'kitchen')).toBe(true);
      expect(canCountLocation(kitchenUser, 'lounge')).toBe(false);
      expect(canCountLocation(kitchenUser, 'warehouse')).toBe(false);

      const loungeUser = makeUser([ABILITIES.INVENTORY_COUNT_LOUNGE]);
      expect(canCountLocation(loungeUser, 'kitchen')).toBe(false);
      expect(canCountLocation(loungeUser, 'lounge')).toBe(true);

      const warehouseUser = makeUser([ABILITIES.INVENTORY_COUNT_WAREHOUSE]);
      expect(canCountLocation(warehouseUser, 'warehouse')).toBe(true);
    });
  });

  describe('canValidateLocation', () => {
    it('retorna false para usuario nulo o ubicación desconocida', () => {
      expect(canValidateLocation(null, 'kitchen')).toBe(false);
      expect(canValidateLocation(makeUser(), 'invalid')).toBe(false);
    });

    it('permite validar por área a jefes de salón y cocina en estado normal', () => {
      const kitchenHead = makeUser([ABILITIES.INVENTORY_VALIDATE_KITCHEN]);
      expect(canValidateLocation(kitchenHead, 'kitchen')).toBe(true);
      expect(canValidateLocation(kitchenHead, 'lounge')).toBe(false);

      const loungeHead = makeUser([ABILITIES.INVENTORY_VALIDATE_LOUNGE]);
      expect(canValidateLocation(loungeHead, 'lounge')).toBe(true);
      expect(canValidateLocation(loungeHead, 'kitchen')).toBe(false);

      // Bodega sin inventory.adjust no se valida por validate.{area}
      expect(canValidateLocation(kitchenHead, 'warehouse')).toBe(false);
    });

    it('quien tiene inventory.adjust puede validar cualquier área en estado normal', () => {
      const admin = makeUser([ABILITIES.INVENTORY_ADJUST]);
      expect(canValidateLocation(admin, 'kitchen')).toBe(true);
      expect(canValidateLocation(admin, 'lounge')).toBe(true);
      expect(canValidateLocation(admin, 'warehouse')).toBe(true);
    });

    it('en estado escalated exige estrictamente inventory.adjust', () => {
      const kitchenHead = makeUser([ABILITIES.INVENTORY_VALIDATE_KITCHEN]);
      const admin = makeUser([ABILITIES.INVENTORY_ADJUST]);

      // El jefe de cocina NO puede validar un conteo escalado
      expect(canValidateLocation(kitchenHead, 'kitchen', 'escalated')).toBe(false);

      // Administración con inventory.adjust SÍ puede validar un conteo escalado
      expect(canValidateLocation(admin, 'kitchen', 'escalated')).toBe(true);
      expect(canValidateLocation(admin, 'lounge', 'escalated')).toBe(true);
      expect(canValidateLocation(admin, 'warehouse', 'escalated')).toBe(true);
    });
  });
});
