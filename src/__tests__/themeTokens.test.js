import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const STYLES_DIR = path.join(ROOT, 'src', 'styles');
const COMPONENTS_DIR = path.join(ROOT, 'src', 'components');
const MAIN_CSS = path.join(STYLES_DIR, 'main.css');
const COLOR_PATTERN = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function rootBlockRange(css) {
  const rootIndex = css.indexOf(':root');
  const open = css.indexOf('{', rootIndex);
  let depth = 0;
  let close = -1;
  for (let index = open; index < css.length; index += 1) {
    if (css[index] === '{') depth += 1;
    if (css[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        close = index;
        break;
      }
    }
  }
  return { open, close };
}

function rootVariables(css) {
  const { open, close } = rootBlockRange(css);
  const block = css.slice(open + 1, close);
  const variables = new Map();
  block.split('\n').forEach((line) => {
    const match = line.match(/^\s*(--[\w-]+)\s*:\s*([^;]+);/);
    if (match) variables.set(match[1], match[2].trim());
  });
  return variables;
}

function listFiles(directory, extension) {
  const files = [];
  fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    if (entry.name === '__tests__' || entry.name === 'node_modules') return;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(full, extension));
    else if (entry.name.endsWith(extension)) files.push(full);
  });
  return files;
}

function violationsFor(file, css) {
  const isMain = path.resolve(file) === path.resolve(MAIN_CSS);
  let skipFrom = -1;
  let skipTo = -1;
  if (isMain) {
    const { open, close } = rootBlockRange(css);
    skipFrom = css.slice(0, open).split('\n').length;
    skipTo = skipFrom + css.slice(open, close + 1).split('\n').length - 1;
  }

  const violations = [];
  css.split('\n').forEach((line, index) => {
    const lineNumber = index + 1;
    if (lineNumber >= skipFrom && lineNumber <= skipTo) return;
    if (COLOR_PATTERN.test(line)) {
      violations.push(`${path.relative(ROOT, file)}:${lineNumber}: ${line.trim()}`);
    }
  });
  return violations;
}

describe('tokens del tema claro (Brief 44p)', () => {
  const mainCss = read(MAIN_CSS);
  const variables = rootVariables(mainCss);

  it('define el fondo blanco y el texto negro de marca', () => {
    expect(variables.get('--bg-dark')).toBe('#ffffff');
    expect(variables.get('--text-main')).toBe('#1d1d1b');
  });

  it('no usa el aqua como color de texto de acento', () => {
    expect(variables.get('--accent')).not.toBe('#62c9c8');
  });

  it('no deja colores escritos a mano fuera de :root', () => {
    const files = [
      ...fs.readdirSync(STYLES_DIR).filter((name) => name.endsWith('.css')).map((name) => path.join(STYLES_DIR, name)),
      ...listFiles(COMPONENTS_DIR, '.jsx'),
    ];

    const violations = files.flatMap((file) => violationsFor(file, read(file)));
    expect(violations).toEqual([]);
  });
});
