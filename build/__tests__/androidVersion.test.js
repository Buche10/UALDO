import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export function calculateAndroidVersionCode(versionString) {
  const parts = versionString.split('.').map(p => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error('Version must follow major.minor.patch format');
  }
  return parts[0] * 10000 + parts[1] * 100 + parts[2];
}

describe('Android version calculation', () => {
  it('calculates 10000 for version 1.0.0', () => {
    expect(calculateAndroidVersionCode('1.0.0')).toBe(10000);
  });

  it('calculates 10203 for version 1.2.3', () => {
    expect(calculateAndroidVersionCode('1.2.3')).toBe(10203);
  });

  it('calculates correct versionCode for package.json current version', () => {
    const pkgPath = resolve(__dirname, '../../package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const code = calculateAndroidVersionCode(pkg.version);
    expect(code).toBe(10000);
  });

  it('throws for invalid version format', () => {
    expect(() => calculateAndroidVersionCode('invalid')).toThrow();
  });
});
