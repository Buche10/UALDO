import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import * as client from '../../services/purchaseDocumentsClient';
import { invoiceErrorMessage, useInvoiceDocument } from '../useInvoiceDocument';

async function flush() {
  await act(async () => { await Promise.resolve(); });
}

describe('useInvoiceDocument (Brief 34ap)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('se detiene cuando el documento queda extraído', async () => {
    const spy = vi.spyOn(client, 'getInvoiceDocument')
      .mockResolvedValueOnce({ ok: true, data: { id: 1, status: 'queued' } })
      .mockResolvedValueOnce({ ok: true, data: { id: 1, status: 'extracted', extraction: { lines: [] } } });

    const { result } = renderHook(() => useInvoiceDocument(1));
    await flush();
    expect(result.current.status).toBe('queued');

    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(result.current.status).toBe('extracted');
    expect(result.current.document.extraction).toEqual({ lines: [] });

    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('se detiene en failed con el mensaje del SRI', async () => {
    const spy = vi.spyOn(client, 'getInvoiceDocument')
      .mockResolvedValueOnce({ ok: true, data: { id: 2, status: 'processing' } })
      .mockResolvedValueOnce({ ok: true, data: { id: 2, status: 'failed', error_code: 'sri_unavailable' } });

    const { result } = renderHook(() => useInvoiceDocument(2));
    await flush();
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });

    expect(result.current.status).toBe('failed');
    expect(result.current.error).toBe(invoiceErrorMessage('sri_unavailable'));
    expect(result.current.error).toBe('El SRI no responde. Prueba en unos minutos o sube el XML.');
    expect(spy).toHaveBeenCalledTimes(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('respeta el máximo de 2 minutos y deja de consultar', async () => {
    const spy = vi.spyOn(client, 'getInvoiceDocument').mockResolvedValue({ ok: true, data: { id: 3, status: 'queued' } });

    const { result } = renderHook(() => useInvoiceDocument(3));
    await flush();
    await act(async () => { await vi.advanceTimersByTimeAsync(120000); });

    expect(result.current.status).toBe('timeout');
    expect(result.current.error).toContain('2 minutos');
    const calls = spy.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    expect(spy).toHaveBeenCalledTimes(calls);
  });

  it('retrocede ante errores de red y se limpia al desmontar', async () => {
    const spy = vi.spyOn(client, 'getInvoiceDocument').mockResolvedValue({ ok: false, status: 0, isNetworkError: true, error: 'Sin conexión' });

    const { result, unmount } = renderHook(() => useInvoiceDocument(4));
    await flush();
    expect(result.current.networkError).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);

    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(spy).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(spy).toHaveBeenCalledTimes(2);

    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
    expect(spy.mock.calls.length).toBeLessThan(4);
  });
});
