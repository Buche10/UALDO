import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AssetReportTab from '../AssetReportTab';
import * as assetsClient from '../../../services/assetsClient';

vi.mock('../../../services/assetsClient', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAssetReport: vi.fn(),
  };
});

describe('AssetReportTab (Brief 38p)', () => {
  const mockReportData = {
    period: '2026-11',
    activos: [
      {
        asset_id: 7,
        name: 'Copa de vino',
        category: 'cristaleria',
        area: 'lounge',
        esperado_inicio: 60,
        roturas_validadas: 4,
        contado: 54,
        diferencia: -2,
        esperado_final: 54,
        min_quantity: 10,
        bajo_minimo: false,
      },
      {
        asset_id: 8,
        name: 'Plato hondo',
        category: 'vajilla',
        area: 'lounge',
        esperado_inicio: 20,
        roturas_validadas: 5,
        contado: 12,
        diferencia: -3,
        esperado_final: 12,
        min_quantity: 15,
        bajo_minimo: true,
      },
    ],
    por_reponer: [
      {
        asset_id: 8,
        name: 'Plato hondo',
        category: 'vajilla',
        area: 'lounge',
        esperado_final: 12,
        min_quantity: 15,
        bajo_minimo: true,
      },
    ],
    reparaciones_pendientes: [
      {
        incident_id: 21,
        asset_id: 7,
        asset_name: 'Copa de vino',
        title: 'Copa rayada',
        status: 'abierta',
        assigned_to: 'Lucía',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    assetsClient.getAssetReport.mockResolvedValue({
      ok: true,
      data: mockReportData,
    });
  });

  it('renders report with replenish and pending repairs blocks and connects incident navigation', async () => {
    const onNavigateToIncident = vi.fn();

    render(
      <AssetReportTab
        user={{ role: 'owner', capabilities: { is_owner: true } }}
        onNavigateToIncident={onNavigateToIncident}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Por reponer (1)')).toBeInTheDocument();
      expect(screen.getByText('Reparaciones pendientes (1)')).toBeInTheDocument();
      expect(screen.getByText('Balance mensual de activos (2)')).toBeInTheDocument();
    });

    // Check "Por reponer" content
    expect(screen.getByText(/Faltan 3/i)).toBeInTheDocument();

    // Check "Reparaciones pendientes" content
    expect(screen.getByText('Copa rayada • Resp: Lucía')).toBeInTheDocument();

    // Click "Ver" on repair item
    const viewIncidentBtn = screen.getByText('Ver');
    fireEvent.click(viewIncidentBtn);

    expect(onNavigateToIncident).toHaveBeenCalledWith(21);
  });
});
