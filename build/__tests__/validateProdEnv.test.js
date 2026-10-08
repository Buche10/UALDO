import { describe, it, expect } from 'vitest';
import { validateProdEnv } from '../validateProdEnv.js';

describe('validateProdEnv module', () => {
  it('throws error when VITE_API_BASE_URL is missing or empty', () => {
    expect(() => validateProdEnv({})).toThrow(/VITE_API_BASE_URL/);
    expect(() => validateProdEnv({ VITE_TEAMS_API_URL: 'https://teams.ualdo.test/api' })).toThrow(/VITE_API_BASE_URL/);
    expect(() => validateProdEnv({ VITE_API_BASE_URL: '   ', VITE_TEAMS_API_URL: 'https://teams.ualdo.test/api' })).toThrow(/VITE_API_BASE_URL/);
  });

  it('throws error when VITE_API_BASE_URL uses http://', () => {
    expect(() => validateProdEnv({
      VITE_API_BASE_URL: 'http://api.ualdo.test/api/v1',
      VITE_TEAMS_API_URL: 'https://teams.ualdo.test/api',
    })).toThrow(/https:\/\//);
  });

  it('throws error when VITE_TEAMS_API_URL is missing or empty', () => {
    expect(() => validateProdEnv({
      VITE_API_BASE_URL: 'https://api.ualdo.test/api/v1',
    })).toThrow(/VITE_TEAMS_API_URL/);

    expect(() => validateProdEnv({
      VITE_API_BASE_URL: 'https://api.ualdo.test/api/v1',
      VITE_TEAMS_API_URL: '',
    })).toThrow(/VITE_TEAMS_API_URL/);
  });

  it('throws error when VITE_TEAMS_API_URL uses http://', () => {
    expect(() => validateProdEnv({
      VITE_API_BASE_URL: 'https://api.ualdo.test/api/v1',
      VITE_TEAMS_API_URL: 'http://teams.ualdo.test/api',
    })).toThrow(/https:\/\//);
  });

  it('returns true when both variables use valid https:// URLs', () => {
    const result = validateProdEnv({
      VITE_API_BASE_URL: 'https://motor.ualdo.corp/api/v1',
      VITE_TEAMS_API_URL: 'https://teams.ualdo.corp/api',
    });
    expect(result).toBe(true);
  });
});
