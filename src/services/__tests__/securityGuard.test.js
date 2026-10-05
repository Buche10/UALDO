import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Security Guard - Forbidden Tokens Check', () => {
  const servicesDir = path.resolve(__dirname, '..');
  const forbiddenTokens = [
    'doblefilo_create_order',
    'doblefilo_set_tables_count',
    'admin123',
    'demo-token'
  ];

  it('ensures no forbidden tokens or direct POS write routes exist in src/services', () => {
    const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('.js') || f.endsWith('.jsx'));

    for (const file of files) {
      const filePath = path.join(servicesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      for (const token of forbiddenTokens) {
        expect(content, `File ${file} contains forbidden token: ${token}`).not.toContain(token);
      }
    }
  });
});
