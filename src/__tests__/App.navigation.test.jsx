import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import * as auth from '../services/auth';
import * as apiClient from '../services/apiClient';

const owner = {
  id: 1,
  name: 'Carlos Dueño',
  role: 'owner',
  capabilities: {
    is_owner: true,
    role: 'owner',
    abilities: ['supply.request', 'supply.decide', 'inventory.view'],
  },
};

const mockAuthenticated = (user = owner) => {
  vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
  vi.spyOn(auth, 'getUser').mockReturnValue(user);
  vi.spyOn(auth, 'fetchMe').mockResolvedValue(user);
};

const mockRequests = (notification) => vi.spyOn(apiClient, 'request').mockImplementation((path) => {
  if (path === '/notifications/unread-count') {
    return Promise.resolve({ ok: true, data: { count: notification ? 1 : 0 } });
  }
  if (path === '/notifications' || path.startsWith('/notifications?')) {
    return Promise.resolve({
      ok: true,
      data: {
        data: notification ? [notification] : [],
        meta: { current_page: 1, last_page: 1 },
      },
    });
  }
  return Promise.resolve({ ok: true, data: { data: [], meta: { current_page: 1, last_page: 1 } } });
});

describe('App navegación del Brief 42p', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('abre en Ualdo y la barra inferior tiene Ualdo, Más y Ajustes', async () => {
    mockAuthenticated();
    mockRequests();

    render(<App />);

    expect(await screen.findByLabelText('Mensaje para el asistente')).toBeInTheDocument();
    const ualdo = screen.getByRole('button', { name: 'Ualdo' });
    expect(ualdo.className).toContain('active');
    expect(screen.getByRole('button', { name: 'Más' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajustes' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Trabajo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Negocios' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Asistente' })).not.toBeInTheDocument();
  });

  it('Más muestra los módulos, el encabezado y el texto del chat', async () => {
    mockAuthenticated();
    mockRequests();

    render(<App />);
    await screen.findByLabelText('Mensaje para el asistente');
    fireEvent.click(screen.getByRole('button', { name: 'Más' }));

    expect(await screen.findByText('Más herramientas')).toBeInTheDocument();
    expect(screen.getByText('Todo esto también lo puedes pedir en el chat.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pedidos:/i })).toBeInTheDocument();
    expect(screen.queryByText('Ualdo Teams')).not.toBeInTheDocument();
  });

  it('Más lleva al chat con el atajo Pedir en el chat', async () => {
    mockAuthenticated();
    mockRequests();

    render(<App />);
    await screen.findByLabelText('Mensaje para el asistente');
    fireEvent.click(screen.getByRole('button', { name: 'Más' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Pedir en el chat' }));

    expect(await screen.findByLabelText('Mensaje para el asistente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ualdo' }).className).toContain('active');
  });

  it('muestra el acceso a Ualdo Teams solo si el usuario ya lo tiene', async () => {
    mockAuthenticated();
    mockRequests();
    localStorage.setItem('teams_token', 'teams-token');

    render(<App />);
    await screen.findByLabelText('Mensaje para el asistente');
    fireEvent.click(screen.getByRole('button', { name: 'Más' }));

    expect(await screen.findByText('Ualdo Teams')).toBeInTheDocument();
  });

  it('un aviso de Negocios abre su pantalla dentro de Más', async () => {
    mockAuthenticated();
    mockRequests({
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Pedido pendiente',
      body: 'Hay un pedido por revisar',
      category: 'pedidos',
      action: { screen: 'pedidos' },
      read_at: '2026-11-02T20:00:00Z',
      created_at: '2026-11-02T20:00:00Z',
    });

    render(<App />);
    await screen.findByLabelText('Mensaje para el asistente');
    fireEvent.click(screen.getByLabelText(/Avisos/i));
    fireEvent.click(await screen.findByText('Pedido pendiente'));

    expect(await screen.findByText('Pedidos internos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Más' }).className).toContain('active');
    expect(screen.getByRole('button', { name: 'Ualdo' }).className).not.toContain('active');
  });

  it('un aviso del chat abre Ualdo', async () => {
    mockAuthenticated();
    mockRequests({
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Resumen listo',
      body: 'Ualdo tiene tu resumen',
      category: 'sistema',
      action: { screen: 'chat' },
      read_at: '2026-11-02T20:00:00Z',
      created_at: '2026-11-02T20:00:00Z',
    });

    render(<App />);
    await screen.findByLabelText('Mensaje para el asistente');
    fireEvent.click(screen.getByRole('button', { name: 'Más' }));
    await screen.findByText('Más herramientas');
    fireEvent.click(screen.getByLabelText(/Avisos/i));
    fireEvent.click(await screen.findByText('Resumen listo'));

    await waitFor(() => {
      expect(screen.getByLabelText('Mensaje para el asistente')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ualdo' }).className).toContain('active');
    });
  });
});
