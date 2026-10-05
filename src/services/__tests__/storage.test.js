import { describe, it, expect, beforeEach } from 'vitest';
import { getSettings, saveSettings } from '../storage';

describe('storage service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default settings when storage is empty', () => {
    const settings = getSettings();
    expect(settings).toBeDefined();
    expect(settings.nodeIp).toBe('192.168.100.10');
    expect(settings.aiProvider).toBe('motor');
  });

  it('saves and merges settings properly', () => {
    const updated = saveSettings({ speechEnabled: true, nodePort: '2000' });
    expect(updated.speechEnabled).toBe(true);
    expect(updated.nodePort).toBe('2000');

    const fetched = getSettings();
    expect(fetched.speechEnabled).toBe(true);
    expect(fetched.nodePort).toBe('2000');
  });
});
