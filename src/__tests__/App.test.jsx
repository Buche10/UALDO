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
});
