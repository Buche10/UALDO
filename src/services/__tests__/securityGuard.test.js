import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Security Guard - Comprehensive Codebase Scan', () => {
  const srcDir = path.resolve(__dirname, '..', '..');

  const forbiddenTokens = [
    'createDoblefiloOrder',
    'setDoblefiloTablesCount',
    '/api/add-item',
    'doblefilo_create_order',
    'doblefilo_set_tables_count',
    'admin123',
    'demo-token',
    'dangerouslySetInnerHTML',
    'updateVercelStock',
    'fetchVercelInventory',
    'doblefilo_vercel_update_stock',
    'doblefilo_vercel_get_inventory',
    '/mobile/inventory',
    'updateDoblefiloStock',
    'getDoblefiloInventory',
    'fetchCanonicalInventory',
    'fetchReorderAlerts'
  ];

  // Unicode emoji range regex with unicode flag
  // eslint-disable-next-line no-misleading-character-class
  const emojiRegex = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/u;

  function getAllSourceFiles(dir) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '__tests__') {
          results = results.concat(getAllSourceFiles(fullPath));
        }
      } else if (entry.isFile() && /\.(js|jsx|css)$/.test(entry.name)) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const allFiles = getAllSourceFiles(srcDir);

  it('scans all src files recursively and confirms zero forbidden tokens', () => {
    for (const filePath of allFiles) {
      const relPath = path.relative(srcDir, filePath);
      const content = fs.readFileSync(filePath, 'utf-8');

      for (const token of forbiddenTokens) {
        expect(
          content.includes(token),
          `File src/${relPath} contains forbidden security token: "${token}"`
        ).toBe(false);
      }
    }
  });

  it('scans all src files recursively and confirms zero emojis exist', () => {
    for (const filePath of allFiles) {
      const relPath = path.relative(srcDir, filePath);
      const content = fs.readFileSync(filePath, 'utf-8');

      const match = emojiRegex.exec(content);
      expect(
        match,
        `File src/${relPath} contains emoji at match: "${match ? match[0] : ''}"`
      ).toBeNull();
    }
  });
});
