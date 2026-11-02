import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AssetsView from '../AssetsView';
import * as assetsClient from '../../../services/assetsClient';

vi.mock('../../../services/assetsClient', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    listAssets: vi.fn().mockResolvedValue({ ok: true, data: [] }),
    getAssetReport: vi.fn().mockResolvedValue({ ok: true, data: { activos: [], por_reponer: [], reparaciones_pendientes: [] } }),
  };
});

describe('AssetsView (Brief 38p)', () => {
  const mockUser = {
    id: 1,
    role: 'owner',
    capabilities: { is_owner: true },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header and allows switching tabs', () => {
    render(<AssetsView user={mockUser} />);

    expect(screen.getByText('Vajilla y equipos')).toBeInTheDocument();
    expect(screen.getByText('Inventario mensual de vajilla, cristalería y equipos por área.')).toBeInTheDocument();

    // Default tab is Catálogo
    expect(screen.getByText('Nuevo activo')).toBeInTheDocument();

    // Switch to Conteo del mes
    fireEvent.click(screen.getByRole('button', { name: 'Conteo del mes' }));
    expect(screen.getByText('Conteo mensual de vajilla y equipos')).toBeInTheDocument();

    // Switch to Reporte
    fireEvent.click(screen.getByRole('button', { name: 'Reporte' }));
    expect(screen.getByText(/Mes del reporte/i)).toBeInTheDocument();
  });

  it('honors initialTab="count"', () => {
    render(<AssetsView user={mockUser} initialTab="count" />);
    expect(screen.getByText('Conteo mensual de vajilla y equipos')).toBeInTheDocument();
  });
});
