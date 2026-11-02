/**
 * Parser de CSV sin dependencias externas (Brief 38p).
 * Soporta RFC 4180: comillas dobles, comas dentro de comillas,
 * comillas escapadas (""), saltos de linea CRLF/LF y filas vacias.
 */

export function parseCsvText(text) {
  if (typeof text !== 'string' || !text.trim()) return [];

  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let insideQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i += 2;
        continue;
      }
      insideQuotes = !insideQuotes;
      i += 1;
      continue;
    }
    if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
      i += 1;
      continue;
    }
    if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i += 1;
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some((c) => c !== '')) rows.push(currentRow);
      currentRow = [];
      i += 1;
      continue;
    }
    currentCell += char;
    i += 1;
  }

  currentRow.push(currentCell.trim());
  if (currentRow.some((c) => c !== '')) rows.push(currentRow);
  return rows;
}

const KNOWN_COLUMNS = {
  categoria: 'category',
  category: 'category',
  nombre: 'name',
  name: 'name',
  codigo: 'code',
  código: 'code',
  code: 'code',
  esperado: 'expected_quantity',
  cantidad_esperada: 'expected_quantity',
  expected_quantity: 'expected_quantity',
  minimo: 'min_quantity',
  mínimo: 'min_quantity',
  min_quantity: 'min_quantity',
};

function normalizeHeader(val) {
  const clean = String(val || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return KNOWN_COLUMNS[clean] || null;
}

function normalizeCategory(val) {
  const clean = String(val || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
  if (clean === 'cristaleria' || clean === 'vajilla') return clean;
  if (clean === 'equipo_salon' || clean === 'salon') return 'equipo_salon';
  if (clean === 'equipo_cocina' || clean === 'cocina') return 'equipo_cocina';
  return clean;
}

function parseRowData(cells, headerMap) {
  const row = {};
  cells.forEach((val, idx) => {
    if (headerMap[idx]) row[headerMap[idx]] = val;
  });

  const category = normalizeCategory(row.category);
  const name = String(row.name || '').trim();
  const code = row.code ? String(row.code).trim() : null;
  const expParsed = parseInt(row.expected_quantity, 10);
  const expected_quantity = Number.isInteger(expParsed) && expParsed >= 0 ? expParsed : NaN;

  let min_quantity = null;
  if (row.min_quantity !== undefined && row.min_quantity !== null && String(row.min_quantity).trim() !== '') {
    const minParsed = parseInt(row.min_quantity, 10);
    min_quantity = Number.isInteger(minParsed) && minParsed >= 0 ? minParsed : NaN;
  }

  return { category, name, code, expected_quantity, min_quantity };
}

export function parseAssetsCsv(text) {
  const matrix = parseCsvText(text);
  if (matrix.length === 0) {
    return { rows: [], errors: ['El archivo o texto CSV está vacío.'] };
  }

  const detectedHeaders = matrix[0].map(normalizeHeader);
  const hasHeaders = detectedHeaders.includes('name') || detectedHeaders.includes('category');
  const headerMap = hasHeaders ? detectedHeaders : ['category', 'name', 'code', 'expected_quantity', 'min_quantity'];
  const dataRows = hasHeaders ? matrix.slice(1) : matrix;
  const rows = [];
  const errors = [];

  dataRows.forEach((cells, index) => {
    const rowNum = hasHeaders ? index + 2 : index + 1;
    if (cells.length < 2) {
      errors.push(`Fila ${rowNum}: faltan columnas requeridas.`);
      return;
    }
    const parsed = parseRowData(cells, headerMap);
    if (!parsed.category) errors.push(`Fila ${rowNum}: categoría requerida.`);
    if (!parsed.name) errors.push(`Fila ${rowNum}: nombre requerido.`);
    if (Number.isNaN(parsed.expected_quantity)) {
      errors.push(`Fila ${rowNum}: la cantidad esperada debe ser un entero mayor o igual a 0.`);
    }
    if (parsed.min_quantity !== null && Number.isNaN(parsed.min_quantity)) {
      errors.push(`Fila ${rowNum}: la cantidad mínima debe ser un entero mayor o igual a 0.`);
    }
    rows.push(parsed);
  });

  if (rows.length > 300) errors.push('No se pueden importar más de 300 activos a la vez.');
  return { rows, errors };
}
