import { describe, it, expect } from 'vitest';
import { DAILY_CLOSE_CAUSES, getCauseLabel } from '../dailyCloseCauses';

describe('dailyCloseCauses (Brief 31p)', () => {
  it('contiene las causas válidas requeridas', () => {
    expect(DAILY_CLOSE_CAUSES.length).toBeGreaterThan(0);
    const values = DAILY_CLOSE_CAUSES.map((c) => c.value);
    expect(values).toContain('error_de_conteo');
    expect(values).toContain('merma_no_registrada');
    expect(values).toContain('consumo_no_registrado');
    expect(values).toContain('otro');
  });

  it('getCauseLabel traduce valores a etiquetas legibles o devuelve valor original', () => {
    expect(getCauseLabel('error_de_conteo')).toBe('Error de conteo');
    expect(getCauseLabel('otro')).toBe('Otro');
    expect(getCauseLabel('causa_desconocida')).toBe('causa_desconocida');
    expect(getCauseLabel('')).toBe('Sin causa');
    expect(getCauseLabel(null)).toBe('Sin causa');
  });
});
