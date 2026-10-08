import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCashClose } from '../useCashClose';
import * as cashCloseClient from '../../services/cashCloseClient';

describe('useCashClose hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('carga el dia exitosamente con fetchClose', async () => {
    vi.spyOn(cashCloseClient, 'getClose').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [{ fecha: '2026-10-05', status: 'revision' }] }
    });

    const onUpdated = vi.fn();
    const { result } = renderHook(() => useCashClose({ fecha: '2026-10-05', onUpdated }));

    let res;
    await act(async () => {
      res = await result.current.fetchClose();
    });

    expect(res).toEqual({ fecha: '2026-10-05', status: 'revision' });
    expect(result.current.cierre).toEqual({ fecha: '2026-10-05', status: 'revision' });
    expect(onUpdated).toHaveBeenCalled();
  });

  it('maneja error en fetchClose', async () => {
    vi.spyOn(cashCloseClient, 'getClose').mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Error del servidor'
    });

    const { result } = renderHook(() => useCashClose({ fecha: '2026-10-05' }));

    await act(async () => {
      await result.current.fetchClose();
    });

    expect(result.current.error).toBe('Error del servidor');
  });

  it('submitNetosReales actualiza el cierre y estado', async () => {
    vi.spyOn(cashCloseClient, 'setNetosReales').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: { fecha: '2026-10-05', tarjeta_neto: 100 } }
    });

    const { result } = renderHook(() => useCashClose({ fecha: '2026-10-05' }));

    await act(async () => {
      const res = await result.current.submitNetosReales({ tarjeta_neto: '100.00' });
      expect(res.ok).toBe(true);
    });

    expect(result.current.cierre?.tarjeta_neto).toBe(100);
  });

  it('submitReopen actualiza el cierre ante reapertura exitosa', async () => {
    vi.spyOn(cashCloseClient, 'reopenClose').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: { fecha: '2026-10-05', status: 'revision' } }
    });

    const { result } = renderHook(() => useCashClose({ fecha: '2026-10-05' }));

    await act(async () => {
      const res = await result.current.submitReopen('Motivo de prueba');
      expect(res.ok).toBe(true);
    });

    expect(result.current.cierre?.status).toBe('revision');
  });

  it('triggerReevaluate maneja exito y 409 con mensaje', async () => {
    vi.spyOn(cashCloseClient, 'reevaluateClose')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { data: { fecha: '2026-10-05', status: 'cerrado' } }
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        error: 'Solo se reevalúan días abiertos con datos de RunFood.',
        data: { message: 'Solo se reevalúan días abiertos con datos de RunFood.' }
      });

    const { result } = renderHook(() => useCashClose({ fecha: '2026-10-05' }));

    await act(async () => {
      const res = await result.current.triggerReevaluate();
      expect(res.ok).toBe(true);
      expect(res.data.status).toBe('cerrado');
    });

    let res409;
    await act(async () => {
      res409 = await result.current.triggerReevaluate();
    });
    expect(res409.ok).toBe(false);
    expect(res409.status).toBe(409);
    expect(result.current.reevaluateError).toBe('Solo se reevalúan días abiertos con datos de RunFood.');
  });

  it('submitReview maneja exito y validacion 422 con fallas', async () => {
    vi.spyOn(cashCloseClient, 'reviewClose')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { data: { fecha: '2026-10-05', status: 'cerrado' } }
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        data: {
          fallas: [{ tipo: 'diferencia_efectivo' }],
          message: 'Hay discrepancias activas.'
        }
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        data: {
          errors: { efectivo_contado: ['Debe ser un número'] },
          message: 'Error de validación.'
        }
      });

    const onReload = vi.fn();
    const { result } = renderHook(() => useCashClose({ fecha: '2026-10-05', onReload }));

    await act(async () => {
      const res = await result.current.submitReview({ efectivo_contado: 100 });
      expect(res.ok).toBe(true);
    });
    expect(result.current.cierre?.status).toBe('cerrado');

    await act(async () => {
      const resFallas = await result.current.submitReview({ efectivo_contado: 100 });
      expect(resFallas.ok).toBe(false);
      expect(resFallas.fallas).toBeDefined();
    });
    expect(onReload).toHaveBeenCalled();
    expect(result.current.fallasModal).toBeDefined();

    await act(async () => {
      const resErr = await result.current.submitReview({ efectivo_contado: -5 });
      expect(resErr.ok).toBe(false);
      expect(resErr.errors).toBeDefined();
    });
    expect(result.current.fieldErrors.efectivo_contado).toBeDefined();
  });

  it('maneja errores genericos del servidor en submitNetosReales, submitReopen y submitReview', async () => {
    vi.spyOn(cashCloseClient, 'setNetosReales').mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Error netos'
    });
    vi.spyOn(cashCloseClient, 'reopenClose').mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Error reapertura'
    });
    vi.spyOn(cashCloseClient, 'reviewClose').mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Error review 500'
    });

    const { result } = renderHook(() => useCashClose({ fecha: '2026-10-05' }));

    await act(async () => {
      const r1 = await result.current.submitNetosReales({});
      expect(r1.ok).toBe(false);
      expect(r1.error).toBe('Error netos');
    });

    await act(async () => {
      const r2 = await result.current.submitReopen('motivo');
      expect(r2.ok).toBe(false);
      expect(r2.error).toBe('Error reapertura');
    });

    await act(async () => {
      const r3 = await result.current.submitReview({});
      expect(r3.ok).toBe(false);
      expect(r3.error).toBe('Error review 500');
    });
  });
});
