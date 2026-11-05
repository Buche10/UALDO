import { describe, it, expect } from 'vitest';
import { groupMappings } from '../usePaymentMappings';

const forma = (id, extra = {}) => ({
  id,
  runfood_forma_pago_id: id,
  bucket: 'sin_mapear',
  suggested_bucket: null,
  confirmado: false,
  ultimo_arqueo: null,
  ...extra
});

const COBRO = { monto: 10, business_date: '2026-11-01' };

describe('groupMappings (Brief 43p)', () => {
  it('manda a otras una forma sin casilla y sin cobros', () => {
    const { enUso, otras } = groupMappings([forma(332)]);

    expect(enUso).toEqual([]);
    expect(otras.map(m => m.id)).toEqual([332]);
  });

  it('pone primera en enUso una forma sin casilla con cobros', () => {
    const { enUso } = groupMappings([
      forma(2, { bucket: 'efectivo', confirmado: true, ultimo_arqueo: COBRO }),
      forma(119, { ultimo_arqueo: COBRO })
    ]);

    expect(enUso.map(m => m.id)).toEqual([119, 2]);
  });

  it('deja en enUso una forma asignada sin cobros', () => {
    const { enUso, otras } = groupMappings([forma(30, { bucket: 'ignorar', confirmado: true })]);

    expect(enUso.map(m => m.id)).toEqual([30]);
    expect(otras).toEqual([]);
  });

  it('ordena por accion, luego sugerencia y luego el resto, y cada grupo por forma de pago', () => {
    const { enUso, otras } = groupMappings([
      forma(105, { bucket: 'credito', confirmado: true, ultimo_arqueo: COBRO }),
      forma(2, { bucket: 'efectivo', confirmado: true, ultimo_arqueo: COBRO }),
      forma(150, { bucket: 'pichincha', suggested_bucket: 'pichincha', confirmado: false }),
      forma(140, { ultimo_arqueo: COBRO }),
      forma(120, { ultimo_arqueo: COBRO }),
      forma(900),
      forma(50)
    ]);

    expect(enUso.map(m => m.id)).toEqual([120, 140, 150, 2, 105]);
    expect(otras.map(m => m.id)).toEqual([50, 900]);
  });

  it('acepta una entrada que no es lista', () => {
    expect(groupMappings(null)).toEqual({ enUso: [], otras: [] });
  });
});
