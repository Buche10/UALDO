import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductionPlan } from '../useProductionPlan';
import * as productionClient from '../../services/productionClient';

const planFor = (quantity) => ({
  ok: true,
  data: { data: { inputs: [{ item_id: 1, expected_quantity: Number(quantity) }], outputs: [{ item_id: 2, expected_quantity: Number(quantity) * 2 }] } },
});

describe('useProductionPlan', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits 400 ms after the last keystroke and shows the engine plan', async () => {
    const spy = vi.spyOn(productionClient, 'getPlan').mockImplementation(async (_id, q) => planFor(q));
    const { result, rerender } = renderHook(({ q }) => useProductionPlan(3, q), { initialProps: { q: '4' } });

    rerender({ q: '4,5' });
    await act(async () => { vi.advanceTimersByTime(399); });
    expect(spy).not.toHaveBeenCalled();

    await act(async () => { vi.advanceTimersByTime(1); });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(3, '4.5');
    expect(result.current.expected).toEqual({ 'input:1': 4.5, 'output:2': 9 });
  });

  it('does not ask for a plan without a valid positive quantity or template', async () => {
    const spy = vi.spyOn(productionClient, 'getPlan');
    const { rerender } = renderHook(({ id, q }) => useProductionPlan(id, q), { initialProps: { id: 3, q: '0' } });
    rerender({ id: 3, q: 'abc' });
    rerender({ id: null, q: '4' });
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(spy).not.toHaveBeenCalled();
  });

  it('never overlaps requests and ends with the plan of the latest quantity', async () => {
    let resolveFirst;
    const spy = vi.spyOn(productionClient, 'getPlan')
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockImplementation(async (_id, q) => planFor(q));

    const { result, rerender } = renderHook(({ q }) => useProductionPlan(3, q), { initialProps: { q: '2' } });
    await act(async () => { vi.advanceTimersByTime(400); });
    expect(spy).toHaveBeenCalledTimes(1);

    rerender({ q: '3' });
    await act(async () => { vi.advanceTimersByTime(400); });
    expect(spy).toHaveBeenCalledTimes(1);

    await act(async () => { resolveFirst(planFor('2')); });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(3, '3');
    expect(result.current.expected).toEqual({ 'input:1': 3, 'output:2': 6 });
  });

  it('clears the previous plan as soon as the quantity changes and marks it as loading', async () => {
    vi.spyOn(productionClient, 'getPlan').mockImplementation(async (_id, q) => planFor(q));
    const { result, rerender } = renderHook(({ q }) => useProductionPlan(3, q), { initialProps: { q: '4' } });
    await act(async () => { vi.advanceTimersByTime(400); });
    expect(result.current.expected['input:1']).toBe(4);

    rerender({ q: '40' });
    expect(result.current.expected).toEqual({});
    expect(result.current.loading).toBe(true);
    await act(async () => { vi.advanceTimersByTime(400); });
    expect(result.current.expected['input:1']).toBe(40);
    expect(result.current.loading).toBe(false);
  });

  it('after unmount it neither asks for more plans nor updates state', async () => {
    let resolveFirst;
    const spy = vi.spyOn(productionClient, 'getPlan')
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockImplementation(async (_id, q) => planFor(q));
    const { rerender, unmount } = renderHook(({ q }) => useProductionPlan(3, q), { initialProps: { q: '4' } });
    await act(async () => { vi.advanceTimersByTime(400); });
    rerender({ q: '45' });
    await act(async () => { vi.advanceTimersByTime(400); });

    unmount();
    await act(async () => { resolveFirst(planFor('4')); });
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('a stale response is discarded and the pending timer asks once for the latest', async () => {
    let resolveFirst;
    const spy = vi.spyOn(productionClient, 'getPlan')
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockImplementation(async (_id, q) => planFor(q));
    const { result, rerender } = renderHook(({ q }) => useProductionPlan(3, q), { initialProps: { q: '2' } });
    await act(async () => { vi.advanceTimersByTime(400); });

    // Cambia la cantidad, pero la respuesta vieja llega antes de que venza el temporizador.
    rerender({ q: '5' });
    await act(async () => { resolveFirst(planFor('2')); });
    expect(result.current.expected).toEqual({});
    expect(spy).toHaveBeenCalledTimes(1);

    await act(async () => { vi.advanceTimersByTime(400); });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(result.current.expected['input:1']).toBe(5);
  });

  it('clears the plan when the engine fails', async () => {
    vi.spyOn(productionClient, 'getPlan').mockResolvedValue({ ok: false, status: 500, error: 'Error' });
    const { result } = renderHook(() => useProductionPlan(3, '4'));
    await act(async () => { vi.advanceTimersByTime(400); });
    expect(result.current.expected).toEqual({});
    expect(result.current.loading).toBe(false);
    expect(result.current.failed).toBe(true);
  });
});
