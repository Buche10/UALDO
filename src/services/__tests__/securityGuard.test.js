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
    'fetchReorderAlerts',
    'syncCashCloseToGoogleSheets',
    'executeDoblefiloDetailedCashClose',
    'ualdo_cash_close_history',
    '/mobile/cash-close',
    'DINERS_NET_FACTOR'
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

  const forbiddenLocationPatterns = [
    'value="bodega"',
    'value="salon"',
    "location: 'bodega'",
    "location: 'salon'",
  ];

  function assertSourceFilesClean(files) {
    for (const filePath of files) {
      const relPath = path.relative(srcDir, filePath).replace(/\\/g, '/');
      const content = fs.readFileSync(filePath, 'utf-8');

      for (const token of forbiddenTokens) {
        // Excepcion explicita del Brief 15c: 'ualdo_cash_close_history' esta permitida
        // UNICAMENTE en 'src/services/auth.js' y solo dentro de removeItem.
        // Cualquier otro uso o presencia en otro archivo de src debe fallar.
        if (token === 'ualdo_cash_close_history' && relPath === 'services/auth.js') {
          const occurrences = content.split(token).length - 1;
          const allowedOccurrences = (content.match(/localStorage\.removeItem\(['"]ualdo_cash_close_history['"]\)/g) || []).length;
          expect(
            occurrences === allowedOccurrences && occurrences > 0,
            `El token ualdo_cash_close_history en ${relPath} solo se permite dentro de localStorage.removeItem(...)`
          ).toBe(true);
          continue;
        }

        expect(
          content.includes(token),
          `File src/${relPath} contains forbidden security token: "${token}"`
        ).toBe(false);
      }

      for (const pattern of forbiddenLocationPatterns) {
        expect(
          content.includes(pattern),
          `File src/${relPath} contains forbidden legacy location pattern: "${pattern}"`
        ).toBe(false);
      }
    }
  }

  it('scans all src files recursively and confirms zero forbidden tokens', () => {
    assertSourceFilesClean(allFiles);
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

  it('hace fallar la guardia si ualdo_cash_close_history aparece fuera de removeItem en otro archivo de src', () => {
    const tempFile = path.join(srcDir, 'temp_history_leak.js');
    try {
      fs.writeFileSync(tempFile, 'export const OLD_KEY = "ualdo_cash_close_history";\n', 'utf-8');
      const filesWithTemp = getAllSourceFiles(srcDir);

      expect(() => {
        assertSourceFilesClean(filesWithTemp);
      }).toThrow(/contains forbidden security token: "ualdo_cash_close_history"/);
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  it('detecta un token prohibido escrito en un archivo temporal de src y luego lo elimina', () => {
    const tempFile = path.join(srcDir, 'temp_security_probe.js');
    const probeToken = ['syncCashClose', 'ToGoogleSheets'].join('');
    try {
      fs.writeFileSync(tempFile, `// Probe test\nconst x = "${probeToken}";\n`, 'utf-8');
      const filesWithTemp = getAllSourceFiles(srcDir);
      let found = false;
      for (const filePath of filesWithTemp) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes(probeToken)) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  it('detecta patrones prohibidos de ubicación legacy como location: bodega en un archivo temporal y falla', () => {
    const tempFile = path.join(srcDir, 'temp_location_legacy_probe.js');
    try {
      fs.writeFileSync(tempFile, `export const config = { location: 'bodega' };\n`, 'utf-8');
      const filesWithTemp = getAllSourceFiles(srcDir);
      expect(() => {
        assertSourceFilesClean(filesWithTemp);
      }).toThrow(/contains forbidden legacy location pattern: "location: 'bodega'"/);
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
});
