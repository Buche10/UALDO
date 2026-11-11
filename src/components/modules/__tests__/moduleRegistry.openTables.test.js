import { describe, it, expect } from 'vitest';
import { ABILITIES } from '../../../services/permissions';
import { getVisibleModules, getModuleBySubView } from '../moduleRegistry';

describe('moduleRegistry - Mesas abiertas (Brief 47p)', () => {
  it('muestra la tarjeta con tables.view', () => {
    const loungeHead = {
      id: 21,
      capabilities: { role: 'lounge_head', abilities: [ABILITIES.TABLES_VIEW] }
    };

    const modules = getVisibleModules(loungeHead);

    expect(modules.some((module) => module.id === 'open_tables')).toBe(true);
  });

  it('oculta la tarjeta para un mesero sin tables.view', () => {
    const waiter = {
      id: 22,
      capabilities: {
        role: 'lounge_staff',
        abilities: [ABILITIES.SUPPLY_REQUEST, ABILITIES.INVENTORY_VIEW]
      }
    };

    const modules = getVisibleModules(waiter);

    expect(modules.some((module) => module.id === 'open_tables')).toBe(false);
  });

  it('declara la subvista, el permiso y la etiqueta de cargo del brief', () => {
    const module = getModuleBySubView('open_tables');

    expect(module).toMatchObject({
      id: 'open_tables',
      label: 'Mesas abiertas',
      description: 'Mesas sin cobrar en RunFood, desde qué hora y con qué mesero.',
      permissions: [ABILITIES.TABLES_VIEW],
      subView: 'open_tables',
      roleRequiredLabel: 'jefe de salón, administración o dueño'
    });
    expect(module.icon).toBeTruthy();
  });
});
