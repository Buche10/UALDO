import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportIncidentSheet from '../ReportIncidentSheet';
import IncidentDetailActions from '../IncidentDetailActions';
import * as incidentsClient from '../../../services/incidentsClient';
import * as assetsClient from '../../../services/assetsClient';

vi.mock('../../../services/incidentsClient', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createIncident: vi.fn(),
    changeStatus: vi.fn(),
  };
});

vi.mock('../../../services/assetsClient', () => ({
  listAssets: vi.fn(),
}));

describe('Incident - Asset Integration (Brief 38p)', () => {
  const mockUser = {
    id: 1,
    name: 'Carlos',
    role: 'owner',
    capabilities: { is_owner: true, role: 'owner', abilities: [] },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    assetsClient.listAssets.mockResolvedValue({
      ok: true,
      data: [
        { id: 10, name: 'Copa vino', code: 'CRI-01', status: 'activo' },
        { id: 12, name: 'Plato hondo', code: 'VAJ-02', status: 'activo' },
      ],
    });
  });

  it('allows selecting an asset when reporting an incident and sends asset_id', async () => {
    incidentsClient.createIncident.mockResolvedValueOnce({
      ok: true,
      data: { id: 101, title: 'Copa rota' },
    });
    const onCreated = vi.fn();
    const onClose = vi.fn();

    render(
      <ReportIncidentSheet
        user={mockUser}
        isOpen
        onClose={onClose}
        onCreated={onCreated}
      />
    );

    // Step 1: select rotura
    fireEvent.click(screen.getByText('Se rompió algo'));

    // Step 2: wait for asset selector to load assets
    await waitFor(() => {
      expect(screen.getByLabelText(/objeto o equipo/i)).toBeInTheDocument();
    });

    // Select asset 10
    const select = screen.getByLabelText(/objeto o equipo/i);
    fireEvent.change(select, { target: { value: '10' } });

    // Submit form
    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Copa rota en mesa 4' } });
    fireEvent.change(screen.getByLabelText(/relato de lo sucedido/i), { target: { value: 'Se cayó de la bandeja al recoger.' } });

    fireEvent.click(screen.getByText('Guardar reporte'));

    await waitFor(() => {
      expect(incidentsClient.createIncident).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rotura',
          title: 'Copa rota en mesa 4',
          asset_id: 10,
        })
      );
      expect(onCreated).toHaveBeenCalled();
    });
  });

  it('shows out-of-service checkbox for avería and sends asset_out_of_service: true', () => {
    const onStatusChange = vi.fn();
    const averiaIncident = {
      id: 20,
      type: 'averia',
      status: 'abierta',
    };

    render(
      <IncidentDetailActions
        incident={averiaIncident}
        canManage
        isOwnerOrAdmin
        submitting={false}
        onStatusChange={onStatusChange}
      />
    );

    const checkbox = screen.getByLabelText(/fuera de servicio mientras se repara/i);
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    fireEvent.click(screen.getByText('Atender'));
    expect(onStatusChange).toHaveBeenCalledWith('en_atencion', { asset_out_of_service: true });
  });
});
