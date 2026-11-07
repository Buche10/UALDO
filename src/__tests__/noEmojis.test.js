import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(process.cwd(), 'src');
const EXTENSIONS = new Set(['.js', '.jsx', '.css']);
const EMOJI_PATTERN = /[\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2460}-\u{24FF}\u{25A0}-\u{27BF}\u{2900}-\u{297F}\u{2B00}-\u{2BFF}\u{3030}\u{303D}\u{1F000}-\u{1FAFF}]|\u{FE0F}/gu;

function listFiles(directory) {
  const files = [];
  fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    if (entry.name === 'node_modules') return;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(full));
    else if (EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  });
  return files;
}

describe('cero emojis en src (Brief 44p_fix)', () => {
  it('no deja caracteres de rangos de emoji en el código', () => {
    const violations = [];

    listFiles(SRC_DIR).forEach((file) => {
      fs.readFileSync(file, 'utf8').split('\n').forEach((line, index) => {
        if (line.match(EMOJI_PATTERN)) {
          violations.push(`${path.relative(process.cwd(), file)}:${index + 1}: ${line.trim()}`);
        }
      });
    });

    expect(violations).toEqual([]);
  });
});
