import { describe, it, expect } from 'vitest';
import { parseCsvText, parseAssetsCsv } from '../csvParser';

describe('parseCsvText', () => {
  it('handles empty or blank text', () => {
    expect(parseCsvText('')).toEqual([]);
    expect(parseCsvText('   \n  \r\n')).toEqual([]);
  });

  it('parses simple unquoted rows', () => {
    const csv = 'vajilla,Plato llano,VAJ-01,50,10\ncristaleria,Copa vino,CRI-02,30,5';
    const result = parseCsvText(csv);
    expect(result).toEqual([
      ['vajilla', 'Plato llano', 'VAJ-01', '50', '10'],
      ['cristaleria', 'Copa vino', 'CRI-02', '30', '5'],
    ]);
  });

  it('parses quoted values containing commas and escaped quotes', () => {
    const csv = '"vajilla","Plato ""Especial"", 24cm",VAJ-99,20,5';
    const result = parseCsvText(csv);
    expect(result).toEqual([
      ['vajilla', 'Plato "Especial", 24cm', 'VAJ-99', '20', '5'],
    ]);
  });

  it('handles CRLF line breaks and empty trailing rows', () => {
    const csv = 'categoria,nombre,codigo,esperado,minimo\r\nvajilla,Taza,VAJ-03,40,8\r\n\r\n';
    const result = parseCsvText(csv);
    expect(result.length).toBe(2);
    expect(result[1][1]).toBe('Taza');
  });
});

describe('parseAssetsCsv', () => {
  it('parses valid CSV with headers and converts types', () => {
    const csv = `categoria,nombre,codigo,esperado,minimo
vajilla,Taza cafe,VAJ-10,24,6
cristalería,Vaso agua,CRI-01,50,10
equipo_cocina,Sartén 28cm,COC-01,4,1`;

    const { rows, errors } = parseAssetsCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toEqual([
      { category: 'vajilla', name: 'Taza cafe', code: 'VAJ-10', expected_quantity: 24, min_quantity: 6 },
      { category: 'cristaleria', name: 'Vaso agua', code: 'CRI-01', expected_quantity: 50, min_quantity: 10 },
      { category: 'equipo_cocina', name: 'Sartén 28cm', code: 'COC-01', expected_quantity: 4, min_quantity: 1 },
    ]);
  });

  it('detects missing columns and invalid numbers', () => {
    const csv = `categoria,nombre,codigo,esperado,minimo
vajilla,,VAJ-11,-5,abc`;

    const { rows, errors } = parseAssetsCsv(csv);
    expect(rows).toHaveLength(1);
    expect(errors.some((e) => e.includes('nombre requerido'))).toBe(true);
    expect(errors.some((e) => e.includes('cantidad esperada'))).toBe(true);
    expect(errors.some((e) => e.includes('cantidad mínima'))).toBe(true);
  });

  it('handles empty input', () => {
    const { rows, errors } = parseAssetsCsv('');
    expect(rows).toHaveLength(0);
    expect(errors[0]).toContain('vacío');
  });

  it('rejects more than 300 rows', () => {
    const lines = ['categoria,nombre,codigo,esperado,minimo'];
    for (let i = 0; i < 305; i += 1) {
      lines.push(`vajilla,Plato ${i},VAJ-${i},10,2`);
    }
    const { errors } = parseAssetsCsv(lines.join('\n'));
    expect(errors.some((e) => e.includes('más de 300 activos'))).toBe(true);
  });
});
