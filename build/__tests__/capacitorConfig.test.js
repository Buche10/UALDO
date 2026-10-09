import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('capacitor.config.ts', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('sets cleartext and allowMixedContent to false when CAP_DEV is undefined', async () => {
    delete process.env.CAP_DEV;
    const config = (await import('../../capacitor.config.ts')).default;
    expect(config.server?.cleartext).toBe(false);
    expect(config.android?.allowMixedContent).toBe(false);
    expect(config.appId).toBe('com.ualdo.ecosystem');
    expect(config.appName).toBe('UALDO');
    expect(config.webDir).toBe('dist');
    expect(config.plugins?.SplashScreen?.backgroundColor).toBe('#1d1d1b');
  });

  it('sets cleartext and allowMixedContent to true when CAP_DEV is "1"', async () => {
    process.env.CAP_DEV = '1';
    const config = (await import('../../capacitor.config.ts')).default;
    expect(config.server?.cleartext).toBe(true);
    expect(config.android?.allowMixedContent).toBe(true);
  });

  it('allows Capacitor CLI to load evaluated config via npx cap config --json', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const cliPath = path.resolve(process.cwd(), 'node_modules/@capacitor/cli');
    if (!fs.existsSync(cliPath)) {
      return;
    }

    const { execSync } = await import('child_process');
    const stdout = execSync('npx cap config --json', {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, CAP_DEV: '0' },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const parsed = JSON.parse(stdout.trim());
    expect(parsed.app?.extConfig?.server?.cleartext).toBe(false);
    expect(parsed.app?.extConfig?.android?.allowMixedContent).toBe(false);
  });
});

