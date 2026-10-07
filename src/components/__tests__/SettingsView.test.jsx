import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsView from '../SettingsView';
import * as apiClient from '../../services/apiClient';
import * as auth from '../../services/auth';

describe('SettingsView component notifications preferences', () => {
  const dummySettings = {
    nodeIp: '127.0.0.1',
    nodePort: 3000,
    aiProvider: 'anthropic',
    apiBaseUrl: 'https://engine.test/api/v1',
  };

  const realContractResponse = {
    preferences: [
      { category: 'pedidos', label: 'Pedidos internos', enabled: true },
      { category: 'inventario', label: 'Inventario y stock', enabled: true },
      { category: 'caja', label: 'Cierre de caja', enabled: true },
      { category: 'sistema', label: 'Sistema y seguridad', enabled: true },
    ],
    critical_always_enabled: true,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders fallback and does not call getPreferences when unauthenticated', async () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(false);
    const requestSpy = vi.spyOn(apiClient, 'request');

    render(<SettingsView settings={dummySettings} onSaveSettings={vi.fn()} onClearAllData={vi.fn()} />);

    expect(screen.getByText('Inicia sesión para gestionar tus avisos.')).toBeInTheDocument();
    expect(requestSpy).not.toHaveBeenCalledWith('/notifications/preferences');
  });

  it('loads preferences using real engine contract and displays engine labels', async () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      ok: true,
      data: realContractResponse,
    });

    render(<SettingsView settings={dummySettings} onSaveSettings={vi.fn()} onClearAllData={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Avisos del Sistema')).toBeInTheDocument();
      expect(screen.getByText('Pedidos internos')).toBeInTheDocument();
      expect(screen.getByText('Inventario y stock')).toBeInTheDocument();
      expect(screen.getByText('Cierre de caja')).toBeInTheDocument();
      expect(screen.getByText('Sistema y seguridad')).toBeInTheDocument();
      expect(screen.getByText(/Los avisos cr[ií]ticos llegan siempre/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('switch', { name: /Desactivar avisos de Pedidos internos/i })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /Desactivar avisos de Inventario y stock/i })).toBeInTheDocument();
  });

  it('maintains compatibility with legacy map format response', async () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      ok: true,
      data: {
        pedidos: true,
        inventario: true,
        caja: true,
        sistema: true,
      },
    });

    render(<SettingsView settings={dummySettings} onSaveSettings={vi.fn()} onClearAllData={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Avisos del Sistema')).toBeInTheDocument();
    });

    expect(screen.getByRole('switch', { name: /Desactivar avisos de pedidos/i })).toBeInTheDocument();
  });

  it('sends PUT payload with list format [{ category, enabled }] via request', async () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    const requestSpy = vi.spyOn(apiClient, 'request')
      .mockResolvedValueOnce({
        ok: true,
        data: realContractResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          preferences: [
            { category: 'pedidos', label: 'Pedidos internos', enabled: false },
            { category: 'inventario', label: 'Inventario y stock', enabled: true },
            { category: 'caja', label: 'Cierre de caja', enabled: true },
            { category: 'sistema', label: 'Sistema y seguridad', enabled: true },
          ],
        },
      });

    render(<SettingsView settings={dummySettings} onSaveSettings={vi.fn()} onClearAllData={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /Desactivar avisos de Pedidos internos/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('switch', { name: /Desactivar avisos de Pedidos internos/i }));

    await waitFor(() => {
      expect(requestSpy).toHaveBeenCalledWith('/notifications/preferences', {
        method: 'PUT',
        body: {
          preferences: [{ category: 'pedidos', enabled: false }],
        },
      });
    });
  });

  it('rolls back toggle state when PUT call fails', async () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(apiClient, 'request')
      .mockResolvedValueOnce({
        ok: true,
        data: realContractResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
        error: 'Error guardando preferencias',
      });

    render(<SettingsView settings={dummySettings} onSaveSettings={vi.fn()} onClearAllData={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /Desactivar avisos de Pedidos internos/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('switch', { name: /Desactivar avisos de Pedidos internos/i }));

    await waitFor(() => {
      expect(screen.getByText(/Error guardando preferencias/i)).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /Desactivar avisos de Pedidos internos/i })).toBeInTheDocument();
    });
  });
});
