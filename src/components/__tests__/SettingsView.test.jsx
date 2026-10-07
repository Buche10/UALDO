import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsView from '../SettingsView';
import * as notificationsClient from '../../services/notificationsClient';

describe('SettingsView component notifications preferences', () => {
  const dummySettings = {
    nodeIp: '127.0.0.1',
    nodePort: 3000,
    aiProvider: 'anthropic',
    apiBaseUrl: 'https://engine.test/api/v1',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and renders notification preference toggles and note', async () => {
    vi.spyOn(notificationsClient, 'getPreferences').mockResolvedValue({
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
      expect(screen.getByText(/Los avisos cr[ií]ticos llegan siempre/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('switch', { name: /Desactivar avisos de pedidos/i })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /Desactivar avisos de inventario/i })).toBeInTheDocument();
  });

  it('updates notification preference via PUT call on toggle click', async () => {
    vi.spyOn(notificationsClient, 'getPreferences').mockResolvedValue({
      ok: true,
      data: {
        pedidos: true,
        inventario: true,
        caja: true,
        sistema: true,
      },
    });
    const updateSpy = vi.spyOn(notificationsClient, 'updatePreferences').mockResolvedValue({
      ok: true,
      data: { pedidos: false, inventario: true, caja: true, sistema: true },
    });

    render(<SettingsView settings={dummySettings} onSaveSettings={vi.fn()} onClearAllData={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /Desactivar avisos de pedidos/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('switch', { name: /Desactivar avisos de pedidos/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith({ pedidos: false });
    });
  });

  it('rolls back toggle state when PUT call fails', async () => {
    vi.spyOn(notificationsClient, 'getPreferences').mockResolvedValue({
      ok: true,
      data: {
        pedidos: true,
        inventario: true,
        caja: true,
        sistema: true,
      },
    });
    vi.spyOn(notificationsClient, 'updatePreferences').mockResolvedValue({
      ok: false,
      error: 'Error guardando preferencias',
    });

    render(<SettingsView settings={dummySettings} onSaveSettings={vi.fn()} onClearAllData={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /Desactivar avisos de pedidos/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('switch', { name: /Desactivar avisos de pedidos/i }));

    await waitFor(() => {
      expect(screen.getByText(/Error guardando preferencias/i)).toBeInTheDocument();
      // Verifies it rolled back to true
      expect(screen.getByRole('switch', { name: /Desactivar avisos de pedidos/i })).toBeInTheDocument();
    });
  });
});
