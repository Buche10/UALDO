import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import * as auth from '../services/auth';
import * as apiClient from '../services/apiClient';

describe('App component login flow and notifications integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('handles login without throwing TypeError and refreshes unread count', async () => {
    let authState = false;
    vi.spyOn(auth, 'isAuthenticated').mockImplementation(() => authState);
    vi.spyOn(auth, 'getUser').mockReturnValue(null);

    const requestSpy = vi.spyOn(apiClient, 'request').mockImplementation((path) => {
      if (path === '/notifications/unread-count') {
        return Promise.resolve({ ok: true, data: { count: 3 } });
      }
      return Promise.resolve({ ok: true, data: {} });
    });

    render(<App />);

    // In unauthenticated state, LoginView is rendered
    expect(screen.getByText(/Iniciar Sesión/i)).toBeInTheDocument();

    // Mock successful login call
    vi.spyOn(auth, 'login').mockImplementation(() => {
      authState = true;
      return Promise.resolve({
        success: true,
        token: 'fake-token-123',
        user: {
          id: 1,
          name: 'Carlos Dueño',
          role: 'owner',
          capabilities: { is_owner: true },
        },
      });
    });

    // Fill credentials and submit login form
    const emailInput = screen.getByPlaceholderText('tu@negocio.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /^Iniciar Sesión$/i });

    fireEvent.change(emailInput, { target: { value: 'owner@ualdo.test' } });
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });
    fireEvent.click(submitBtn);

    // Verify login succeeds without error and triggers unread-count check
    await waitFor(() => {
      expect(screen.queryByText(/Iniciar Sesión/i)).not.toBeInTheDocument();
    });

    expect(requestSpy).toHaveBeenCalledWith('/notifications/unread-count');
  });

  it('navega desde un aviso de cierre_caja con fecha valida (2026-10-05) y abre el detalle del dia', async () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(auth, 'getUser').mockReturnValue({
      id: 1,
      name: 'Carlos Dueño',
      capabilities: { is_owner: true }
    });
    vi.spyOn(auth, 'fetchMe').mockResolvedValue({
      id: 1,
      name: 'Carlos Dueño',
      capabilities: { is_owner: true }
    });

    vi.spyOn(apiClient, 'request').mockImplementation((path) => {
      if (path === '/notifications/unread-count') {
        return Promise.resolve({ ok: true, data: { count: 1 } });
      }
      if (path.startsWith('/restaurant/cash-close?date=')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          data: { data: [{ fecha: '2026-10-05', status: 'cerrado' }] }
        });
      }
      if (path === '/notifications' || path.startsWith('/notifications?')) {
        return Promise.resolve({
          ok: true,
          data: {
            data: [
              {
                id: '11111111-1111-1111-1111-111111111111',
                title: 'Cierre del día',
                body: 'Revisión pendiente',
                category: 'caja',
                action: { screen: 'cierre_caja', params: { fecha: '2026-10-05' } },
                read_at: '2026-10-05T20:00:00Z',
                created_at: '2026-10-05T20:00:00Z'
              }
            ],
            meta: { current_page: 1, last_page: 1 }
          }
        });
      }
      return Promise.resolve({ ok: true, data: {} });
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText(/Iniciando UALDO Mobile/i)).not.toBeInTheDocument();
    });

    // Abrir panel de avisos
    const bellBtn = screen.getByLabelText(/Avisos/i);
    fireEvent.click(bellBtn);

    await waitFor(() => {
      expect(screen.getByText('Cierre del día')).toBeInTheDocument();
    });

    // Clic en la notificación
    fireEvent.click(screen.getByText('Cierre del día'));

    // Debe abrir el detalle del día 2026-10-05
    await waitFor(() => {
      expect(screen.getByText('2026-10-05')).toBeInTheDocument();
    });
  });

  it('un aviso con params.fecha malicioso ("javascript:alert(1)") abre la lista sin fecha', async () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(auth, 'getUser').mockReturnValue({
      id: 1,
      name: 'Carlos Dueño',
      capabilities: { is_owner: true }
    });
    vi.spyOn(auth, 'fetchMe').mockResolvedValue({
      id: 1,
      name: 'Carlos Dueño',
      capabilities: { is_owner: true }
    });

    vi.spyOn(apiClient, 'request').mockImplementation((path) => {
      if (path === '/notifications/unread-count') {
        return Promise.resolve({ ok: true, data: { count: 1 } });
      }
      if (path === '/restaurant/cash-close' || path.startsWith('/restaurant/cash-close?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          data: { data: [] }
        });
      }
      if (path === '/notifications' || path.startsWith('/notifications?')) {
        return Promise.resolve({
          ok: true,
          data: {
            data: [
              {
                id: '22222222-2222-2222-2222-222222222222',
                title: 'Aviso malicioso',
                body: 'Aviso con fecha javascript',
                category: 'caja',
                action: { screen: 'cierre_caja', params: { fecha: 'javascript:alert(1)' } },
                read_at: '2026-10-05T20:00:00Z',
                created_at: '2026-10-05T20:00:00Z'
              }
            ],
            meta: { current_page: 1, last_page: 1 }
          }
        });
      }
      return Promise.resolve({ ok: true, data: {} });
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText(/Iniciando UALDO Mobile/i)).not.toBeInTheDocument();
    });

    const bellBtn = screen.getByLabelText(/Avisos/i);
    fireEvent.click(bellBtn);

    await waitFor(() => {
      expect(screen.getByText('Aviso malicioso')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Aviso malicioso'));

    // Debe abrir la lista de cierres, sin fecha seleccionada
    await waitFor(() => {
      expect(screen.getByText('Cierres de Caja')).toBeInTheDocument();
    });
  });
});
