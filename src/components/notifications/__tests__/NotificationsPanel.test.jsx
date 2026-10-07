import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationsPanel from '../NotificationsPanel';
import * as notificationsClient from '../../../services/notificationsClient';

describe('NotificationsPanel component', () => {
  const mockNotifications = [
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      category: 'pedidos',
      priority: 'warning',
      title: 'Pedido retrasado',
      body: 'El pedido #104 esta pendiente de preparacion',
      read_at: null,
      action_screen: 'pedidos',
      action_params: { id: 104 },
      created_at: new Date().toISOString(),
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174002',
      category: 'inventario',
      priority: 'critical',
      title: 'Stock Critico: Queso',
      body: '<script>alert("xss")</script>Quedan menos de 2 kg en bodega',
      read_at: '2026-10-07T10:00:00Z',
      action_screen: 'inventario',
      action_params: { id: 12 },
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders notification list and safely treats HTML tags as plain text without execution', async () => {
    vi.spyOn(notificationsClient, 'listNotifications').mockResolvedValue({
      ok: true,
      data: { data: mockNotifications, meta: { current_page: 1, last_page: 1 } },
    });

    render(<NotificationsPanel onClose={vi.fn()} onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Pedido retrasado')).toBeInTheDocument();
      expect(screen.getByText('Stock Critico: Queso')).toBeInTheDocument();
    });

    // Verify script tag is rendered as harmless visible text, NOT executed
    expect(screen.getByText(/<script>alert\("xss"\)<\/script>Quedan menos de 2 kg en bodega/i)).toBeInTheDocument();
  });

  it('marks unread notification as read on click and invokes navigation whitelist route', async () => {
    vi.spyOn(notificationsClient, 'listNotifications').mockResolvedValue({
      ok: true,
      data: { data: mockNotifications, meta: { current_page: 1, last_page: 1 } },
    });
    const markReadSpy = vi.spyOn(notificationsClient, 'markRead').mockResolvedValue({
      ok: true,
      data: { message: 'Marcada' },
    });

    const handleNavigate = vi.fn();
    render(<NotificationsPanel onClose={vi.fn()} onNavigate={handleNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Pedido retrasado')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Pedido retrasado'));

    await waitFor(() => {
      expect(markReadSpy).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001');
      expect(handleNavigate).toHaveBeenCalledWith({
        tab: 'asistente',
        params: { id: 104 },
      });
    });
  });

  it('marks all as read with the active category filter', async () => {
    vi.spyOn(notificationsClient, 'listNotifications').mockResolvedValue({
      ok: true,
      data: { data: mockNotifications, meta: { current_page: 1, last_page: 1 } },
    });
    const markAllReadSpy = vi.spyOn(notificationsClient, 'markAllRead').mockResolvedValue({
      ok: true,
      data: { affected: 2 },
    });

    render(<NotificationsPanel onClose={vi.fn()} onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Marcar leídas')).toBeInTheDocument();
    });

    // Filter by inventario first
    fireEvent.click(screen.getByRole('button', { name: /^inventario$/i }));

    // Click mark all read
    fireEvent.click(screen.getByText('Marcar leídas'));

    await waitFor(() => {
      expect(markAllReadSpy).toHaveBeenCalledWith('inventario');
    });
  });

  it('marks read but does NOT navigate when screen is disallowed (URL or admin)', async () => {
    const disallowedNotifs = [
      {
        id: '123e4567-e89b-12d3-a456-426614174091',
        category: 'sistema',
        priority: 'warning',
        title: 'Aviso con URL maliciosa',
        body: 'Intento de redireccion',
        read_at: null,
        action: { screen: 'https://evil.example', params: {} },
        created_at: new Date().toISOString(),
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174092',
        category: 'sistema',
        priority: 'warning',
        title: 'Aviso con pantalla admin',
        body: 'Intento de pantalla no permitida',
        read_at: null,
        action: { screen: 'admin', params: {} },
        created_at: new Date().toISOString(),
      },
    ];

    vi.spyOn(notificationsClient, 'listNotifications').mockResolvedValue({
      ok: true,
      data: { data: disallowedNotifs, meta: { current_page: 1, last_page: 1 } },
    });
    const markReadSpy = vi.spyOn(notificationsClient, 'markRead').mockResolvedValue({
      ok: true,
      data: { message: 'Marcada' },
    });

    const handleNavigate = vi.fn();
    render(<NotificationsPanel onClose={vi.fn()} onNavigate={handleNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Aviso con URL maliciosa')).toBeInTheDocument();
      expect(screen.getByText('Aviso con pantalla admin')).toBeInTheDocument();
    });

    // Click evil URL notification
    fireEvent.click(screen.getByText('Aviso con URL maliciosa'));
    await waitFor(() => {
      expect(markReadSpy).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174091');
    });
    expect(handleNavigate).not.toHaveBeenCalled();

    // Click admin notification
    fireEvent.click(screen.getByText('Aviso con pantalla admin'));
    await waitFor(() => {
      expect(markReadSpy).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174092');
    });
    expect(handleNavigate).not.toHaveBeenCalled();
  });

  it('navigates to inventario and strips URL parameter from params', async () => {
    const notifWithEvilParam = [
      {
        id: '123e4567-e89b-12d3-a456-426614174093',
        category: 'inventario',
        priority: 'warning',
        title: 'Aviso con url en params',
        body: 'Parametros con url sucia',
        read_at: null,
        action: {
          screen: 'inventario',
          params: { url: 'https://evil.example', id: 5 },
        },
        created_at: new Date().toISOString(),
      },
    ];

    vi.spyOn(notificationsClient, 'listNotifications').mockResolvedValue({
      ok: true,
      data: { data: notifWithEvilParam, meta: { current_page: 1, last_page: 1 } },
    });
    vi.spyOn(notificationsClient, 'markRead').mockResolvedValue({
      ok: true,
      data: { message: 'Marcada' },
    });

    const handleNavigate = vi.fn();
    render(<NotificationsPanel onClose={vi.fn()} onNavigate={handleNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Aviso con url en params')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Aviso con url en params'));

    await waitFor(() => {
      expect(handleNavigate).toHaveBeenCalledWith({
        tab: 'negocios',
        subView: 'inventory',
        params: { id: 5 }, // url removed
      });
    });
  });

  it('keeps notification as unread and displays error when markRead fails', async () => {
    const unreadNotif = [
      {
        id: '123e4567-e89b-12d3-a456-426614174094',
        category: 'sistema',
        priority: 'warning',
        title: 'Aviso que fallara al leer',
        body: 'Falla simulada de red',
        read_at: null,
        action: { screen: 'inventario' },
        created_at: new Date().toISOString(),
      },
    ];

    vi.spyOn(notificationsClient, 'listNotifications').mockResolvedValue({
      ok: true,
      data: { data: unreadNotif, meta: { current_page: 1, last_page: 1 } },
    });
    vi.spyOn(notificationsClient, 'markRead').mockResolvedValue({
      ok: false,
      error: 'Error de conexion en servidor',
    });

    const handleNavigate = vi.fn();
    render(<NotificationsPanel onClose={vi.fn()} onNavigate={handleNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Aviso que fallara al leer')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Aviso que fallara al leer'));

    await waitFor(() => {
      expect(screen.getByText('Error de conexion en servidor')).toBeInTheDocument();
    });

    // Navigation should NOT have happened because markRead failed
    expect(handleNavigate).not.toHaveBeenCalled();
  });
});
