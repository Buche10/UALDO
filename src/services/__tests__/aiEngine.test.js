import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkMotorHealth, checkNodeStatus, ENGINE_HEALTH_PATH } from '../aiEngine';
import * as apiClient from '../apiClient';

describe('aiEngine health (Brief 41p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('devuelve ok cuando el motor responde con status ok', async () => {
    const request = vi.spyOn(apiClient, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { status: 'ok', checks: { database: 'ok' }, version: 'abc1234' },
    });

    const result = await checkMotorHealth();

    expect(request).toHaveBeenCalledWith(ENGINE_HEALTH_PATH);
    expect(result.status).toBe('ok');
    expect(result.version).toBe('abc1234');
    expect(result.latency).toBeGreaterThanOrEqual(0);
  });

  it('devuelve issues cuando el motor responde 503', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      ok: false,
      status: 503,
      data: { status: 'fail', checks: { database: 'fail' } },
    });

    const result = await checkMotorHealth();

    expect(result.status).toBe('issues');
    expect(result.error).toMatch(/problemas/i);
  });

  it('devuelve issues si responde 200 sin status ok', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, status: 200, data: {} });

    expect((await checkMotorHealth()).status).toBe('issues');
  });

  it('devuelve offline cuando no hay respuesta', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      ok: false,
      status: 0,
      isNetworkError: true,
      error: 'Error de conexión',
    });

    const result = await checkMotorHealth();

    expect(result.status).toBe('offline');
    expect(result.latency).toBe(0);
  });

  it('checkNodeStatus usa la salud del motor para el proveedor motor', async () => {
    vi.spyOn(apiClient, 'request')
      .mockResolvedValueOnce({ ok: true, status: 200, data: { status: 'ok', version: 'abc1234' } })
      .mockResolvedValueOnce({ ok: false, status: 503, data: { status: 'fail' } });

    const online = await checkNodeStatus('10.0.0.1', '80', 'motor');
    expect(online.online).toBe(true);
    expect(online.models[0]).toMatch(/Motor Ualdo/);

    const offline = await checkNodeStatus('10.0.0.1', '80', 'motor');
    expect(offline.online).toBe(false);
    expect(offline.error).toMatch(/problemas/i);
  });
});
