import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CashCloseView from '../CashCloseView';
import * as apiClient from '../../services/apiClient';
import * as cashCloseClient from '../../services/cashCloseClient';

describe('CashCloseView component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('bloquea al personal sin is_owner sin realizar peticiones a la API', async () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 2,
      name: 'Mesero Pedro',
      capabilities: { is_owner: false }
    });

    const listSpy = vi.spyOn(cashCloseClient, 'listCloses');

    render(<CashCloseView />);

    expect(screen.getByText('Solo el dueño puede ver la caja.')).toBeInTheDocument();

    // Esperar a que se asienten los efectos asincronos antes de asegurar que nunca se llamo a la API
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(listSpy).not.toHaveBeenCalled();
  });

  it('permite acceso al dueño con is_owner y consulta listCloses', async () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 1,
      name: 'Roberto Dueno',
      capabilities: { is_owner: true }
    });

    const listSpy = vi.spyOn(cashCloseClient, 'listCloses').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [] }
    });

    render(<CashCloseView />);

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalled();
      expect(screen.getByText('Cierres de Caja')).toBeInTheDocument();
    });
  });

  it('muestra el mensaje de solo el dueno si el servidor responde 403', async () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 1,
      name: 'Roberto',
      capabilities: { is_owner: true }
    });

    vi.spyOn(cashCloseClient, 'listCloses').mockResolvedValue({
      ok: false,
      status: 403,
      error: 'Prohibido'
    });

    render(<CashCloseView />);

    await waitFor(() => {
      expect(screen.getByText('Solo el dueño puede ver la caja.')).toBeInTheDocument();
    });
  });

  it('abre directamente el detalle cuando fechaInicial es valida (2026-10-05)', async () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 1,
      name: 'Roberto Dueno',
      capabilities: { is_owner: true }
    });

    const getCloseSpy = vi.spyOn(cashCloseClient, 'getClose').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [{ fecha: '2026-10-05', status: 'cerrado' }] }
    });

    render(<CashCloseView fechaInicial="2026-10-05" />);

    await waitFor(() => {
      expect(getCloseSpy).toHaveBeenCalledWith('2026-10-05');
      expect(screen.getByText('2026-10-05')).toBeInTheDocument();
    });
  });

  it('ignora fechaInicial maliciosa ("javascript:alert(1)") y abre la lista', async () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 1,
      name: 'Roberto Dueno',
      capabilities: { is_owner: true }
    });

    const listSpy = vi.spyOn(cashCloseClient, 'listCloses').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [] }
    });

    render(<CashCloseView fechaInicial="javascript:alert(1)" />);

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalled();
      expect(screen.getByText('Cierres de Caja')).toBeInTheDocument();
    });
  });

  it('permite volver de detalle a la lista y abrir formulario manual con cancelacion', async () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 1,
      name: 'Roberto Dueno',
      capabilities: { is_owner: true }
    });

    vi.spyOn(cashCloseClient, 'listCloses').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [{ fecha: '2026-10-05', status: 'cerrado' }] }
    });

    vi.spyOn(cashCloseClient, 'getClose').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [{ fecha: '2026-10-05', status: 'cerrado' }] }
    });

    const { unmount } = render(<CashCloseView />);

    await waitFor(() => {
      expect(screen.getByText('Cierres de Caja')).toBeInTheDocument();
    });

    // Abrir manual
    fireEvent.click(screen.getByText('Cargar a mano'));
    expect(screen.getByText('Cargar Cierre a Mano')).toBeInTheDocument();

    // Cancelar manual
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(screen.getByText('Cierres de Caja')).toBeInTheDocument();

    // Abrir detalle haciendo clic en el cierre
    fireEvent.click(screen.getByText('2026-10-05'));
    await waitFor(() => {
      expect(screen.getByText('Volver a la lista')).toBeInTheDocument();
    });

    // Clic en Volver a la lista
    fireEvent.click(screen.getByText('Volver a la lista'));
    await waitFor(() => {
      expect(screen.getByText('Cierres de Caja')).toBeInTheDocument();
    });
  });
});
