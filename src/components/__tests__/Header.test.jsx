import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Header from '../Header';
import { ROLES, ROLE_LABELS } from '../../services/permissions';
import * as apiClient from '../../services/apiClient';
import { ENGINE_HEALTH_PATH } from '../../services/aiEngine';

const healthOk = { ok: true, status: 200, data: { status: 'ok', checks: {}, version: 'abc1234' } };
const healthIssues = { ok: false, status: 503, data: { status: 'fail', checks: { database: 'fail' } } };
const healthOffline = { ok: false, status: 0, isNetworkError: true, error: 'Error de conexión' };

describe('Header component (Brief 30p / 41p)', () => {
  const baseProps = {
    activeTab: 'negocios',
    onOpenNotifications: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    vi.useRealTimers();
  });

  it('muestra el nombre y el cargo del usuario autenticado bajo el nombre', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue(healthOk);
    const user = {
      id: 12,
      name: 'Manuel Cedeño',
      capabilities: {
        role: ROLES.KITCHEN_HEAD,
        role_label: ROLE_LABELS.kitchen_head,
      },
    };

    render(<Header {...baseProps} isAuthenticated={true} user={user} />);

    expect(screen.getByText('Ualdo Negocios')).toBeInTheDocument();
    expect(screen.getByText('Manuel Cedeño')).toBeInTheDocument();
    expect(screen.getByText('Jefe de cocina')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Conectado')).toBeInTheDocument());
  });

  it('no muestra datos de usuario si no está autenticado', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue(healthOk);
    render(<Header {...baseProps} activeTab="asistente" isAuthenticated={false} user={null} />);

    expect(screen.getByText('Asistente')).toBeInTheDocument();
    expect(screen.queryByText('Jefe de cocina')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Conectado')).toBeInTheDocument());
  });

  it('muestra Conectado con la latencia cuando el motor responde ok', async () => {
    const request = vi.spyOn(apiClient, 'request').mockResolvedValue(healthOk);
    render(<Header {...baseProps} />);

    await waitFor(() => expect(screen.getByText('Conectado')).toBeInTheDocument());
    expect(screen.getByText(/\d+ ms/)).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith(ENGINE_HEALTH_PATH);
  });

  it('muestra Motor con problemas cuando responde pero no está ok', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue(healthIssues);
    render(<Header {...baseProps} />);

    await waitFor(() => expect(screen.getByText('Motor con problemas')).toBeInTheDocument());
    expect(screen.queryByText('Conectado')).not.toBeInTheDocument();
  });

  it('muestra Sin conexión cuando el motor no responde', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue(healthOffline);
    render(<Header {...baseProps} />);

    await waitFor(() => expect(screen.getByText('Sin conexión')).toBeInTheDocument());
  });

  it('consulta cada 60 segundos solo con la app visible y al tocar el indicador', async () => {
    vi.useFakeTimers();
    const request = vi.spyOn(apiClient, 'request').mockResolvedValue(healthOk);
    render(<Header {...baseProps} />);

    await act(async () => { await Promise.resolve(); });
    expect(request).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(60000);
      await Promise.resolve();
    });
    expect(request).toHaveBeenCalledTimes(2);

    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    await act(async () => {
      vi.advanceTimersByTime(180000);
      await Promise.resolve();
    });
    expect(request).toHaveBeenCalledTimes(2);

    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });
    expect(request).toHaveBeenCalledTimes(3);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Estado del motor/i }));
      await Promise.resolve();
    });
    expect(request).toHaveBeenCalledTimes(4);
  });

  it('no consulta el motor con la app en segundo plano', async () => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    const request = vi.spyOn(apiClient, 'request').mockResolvedValue(healthOk);

    render(<Header {...baseProps} />);
    await act(async () => { await Promise.resolve(); });

    expect(request).not.toHaveBeenCalled();
  });
});
