import { describe, it, expect } from 'vitest';
import {
  emptyLotSelection,
  lotJustificationPrompt,
  lotPayloadFields,
  lotSelectionError,
  normalizeLotJustification,
} from '../lotSelection';

describe('lotSelection (Brief 40p)', () => {
  it('exige motivo solo cuando se salta el lote recomendado', () => {
    expect(lotSelectionError(emptyLotSelection())).toBeNull();
    expect(lotSelectionError({ lotId: 3, needsJustification: false })).toBeNull();
    expect(lotSelectionError({ lotId: 3, needsJustification: true, justification: '' })).toContain('Indica el motivo');
    expect(lotSelectionError({ lotId: 3, needsJustification: true, justification: 'abc' })).toContain('5 a 300');
    expect(lotSelectionError({ lotId: 3, needsJustification: true, justification: 'Reservado para evento' })).toBeNull();
  });

  it('usa el texto exacto del Brief y recorta el motivo', () => {
    expect(lotJustificationPrompt('L0001', 'L0002')).toBe('Hay un lote más antiguo (L0001). ¿Por qué usas L0002?');
    expect(normalizeLotJustification('  Reservado para el evento  ')).toBe('Reservado para el evento');
    expect(normalizeLotJustification('abc')).toBeNull();
  });

  it('arma los campos del motor solo cuando hay lote y justificación válida', () => {
    expect(lotPayloadFields({ lotId: '', needsJustification: false })).toEqual({});
    expect(lotPayloadFields({ lotId: 5, needsJustification: false, justification: 'ignorada' })).toEqual({ lot_id: 5 });
    expect(lotPayloadFields({ lotId: '6', needsJustification: true, justification: 'Reservado para evento' })).toEqual({
      lot_id: 6,
      justification: 'Reservado para evento',
    });
  });
});
