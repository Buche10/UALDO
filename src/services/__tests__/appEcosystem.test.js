import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  executeLocalTool,
  getRegisteredApps,
  saveRegisteredApps,
} from '../appEcosystem';

describe('appEcosystem sin herramientas locales muertas (Brief 41p)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('ya no expone executeLocalTool', () => {
    expect(executeLocalTool).toBeUndefined();
  });

  it('conserva el registro de apps en localStorage', () => {
    const apps = getRegisteredApps();
    expect(Array.isArray(apps)).toBe(true);

    saveRegisteredApps([{ id: 'x', name: 'X' }]);
    expect(getRegisteredApps()).toEqual([{ id: 'x', name: 'X' }]);
  });
});
