import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Header from '../components/Header';
import LoginView from '../components/LoginView';
import * as apiClient from '../services/apiClient';

describe('logos de marca sobre fondo claro (Brief 44p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { status: 'ok', checks: {}, version: 'abc1234' },
    });
  });

  it('la cabecera usa el logo para fondo claro', async () => {
    render(<Header activeTab="negocios" onOpenNotifications={vi.fn()} />);

    const logo = screen.getByAltText('Ualdo');
    expect(logo).toHaveAttribute('src', '/brand/ualdo-fondo-claro.png');
    await waitFor(() => expect(screen.getByText('Conectado')).toBeInTheDocument());
  });

  it('el login usa el logo para fondo claro', () => {
    render(<LoginView />);

    const logo = screen.getByAltText('Ualdo');
    expect(logo).toHaveAttribute('src', '/brand/ualdo-fondo-claro.png');
  });
});
