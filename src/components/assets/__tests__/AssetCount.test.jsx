import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AssetCountTab from '../AssetCountTab';
import * as assetsClient from '../../../services/assetsClient';
import { ABILITIES } from '../../../services/permissions';

vi.mock('../../../services/assetsClient', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAssetCountForPeriod: vi.fn(),
    getAssetCount: vi.fn(),
    createAssetCount: vi.fn(),
    saveAssetCountLines: vi.fn(),
    submitAssetCount: vi.fn(),
    saveAssetExplanations: vi.fn(),
    validateAssetCount: vi.fn(),
  };
});

describe('AssetCountTab (Brief 38p / 38p_fix)', () => {
  const loungeHeadUser = {
    id: 10,
    role: 'lounge_head',
    capabilities: {
      role: 'lounge_head',
      abilities: [ABILITIES.ASSETS_COUNT_LOUNGE, ABILITIES.ASSETS_VALIDATE_LOUNGE],
    },
  };

  const loungeStaffUser = {
    id: 11,
    role: 'lounge_staff',
    capabilities: {
      role: 'lounge_staff',
      abilities: [ABILITIES.ASSETS_COUNT_LOUNGE],
    },
  };

  const mockDraftCount = {
    id: 5,
    area: 'lounge',
    period: '2026-11',
    status: 'draft',
    lines: [
      { id: 101, asset_id: 1, asset_name: 'Copa de agua', expected_quantity: null, counted_quantity: null },
      { id: 102, asset_id: 2, asset_name: 'Plato llano', expected_quantity: null, counted_quantity: null },
    ],
  };

  const mockSubmittedCountWithExplanations = {
    id: 5,
    area: 'lounge',
    period: '2026-11',
    status: 'submitted',
    lines: [
      { id: 101, asset_id: 1, asset_name: 'Copa de agua', expected_quantity: 40, counted_quantity: 38, difference: -2, explanation: 'Rotura en servicio' },
      { id: 102, asset_id: 2, asset_name: 'Plato llano', expected_quantity: 20, counted_quantity: 20, difference: 0, explanation: null },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('sin conteo muestra "Empezar"', async () => {
    assetsClient.getAssetCountForPeriod.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: null,
    });

    render(<AssetCountTab user={loungeStaffUser} />);

    expect(await screen.findByRole('button', { name: /Empezar/i })).toBeInTheDocument();
    expect(screen.queryByText('Seguir contando')).not.toBeInTheDocument();
    expect(screen.queryByText('En borrador')).not.toBeInTheDocument();
  });

  it('con conteo en borrador muestra "Seguir contando" y estado "En borrador"', async () => {
    assetsClient.getAssetCountForPeriod.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: mockDraftCount,
    });

    render(<AssetCountTab user={loungeStaffUser} />);

    expect(await screen.findByText('En borrador')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Seguir contando/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Empezar$/i })).not.toBeInTheDocument();
  });

  it('quien cuenta no ve el esperado en draft en la planilla', async () => {
    assetsClient.getAssetCountForPeriod.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: mockDraftCount,
    });

    render(<AssetCountTab user={loungeStaffUser} />);

    const continueBtn = await screen.findByRole('button', { name: /Seguir contando/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText(/Planilla de conteo: Salón/i)).toBeInTheDocument();
      expect(screen.getByText('Copa de agua')).toBeInTheDocument();
      expect(screen.getByText('Plato llano')).toBeInTheDocument();
    });

    // La columna esperado no debe existir en draft
    expect(screen.queryByText('Esperado')).not.toBeInTheDocument();
    expect(screen.queryByText('40')).not.toBeInTheDocument();
    expect(screen.queryByText('20')).not.toBeInTheDocument();
  });

  it('el 409 con data.id abre el conteo existente sin mostrar error', async () => {
    assetsClient.getAssetCountForPeriod.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: null,
    });

    assetsClient.createAssetCount.mockResolvedValueOnce({
      ok: false,
      status: 409,
      data: { id: 77, status: 'draft' },
      error: 'Ya existe un conteo',
    });

    assetsClient.getAssetCount.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: {
        id: 77,
        area: 'lounge',
        period: '2026-11',
        status: 'draft',
        lines: [
          { id: 201, asset_id: 3, asset_name: 'Tenedor de mesa', expected_quantity: null, counted_quantity: null },
        ],
      },
    });

    render(<AssetCountTab user={loungeStaffUser} />);

    const startBtn = await screen.findByRole('button', { name: /Empezar/i });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(assetsClient.createAssetCount).toHaveBeenCalledWith('lounge', '2026-11');
      expect(assetsClient.getAssetCount).toHaveBeenCalledWith(77);
      expect(screen.getByText('Tenedor de mesa')).toBeInTheDocument();
    });

    // No debe mostrar banner de error
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('el jefe de salón abre el conteo enviado por otra persona y lo valida', async () => {
    const validatedCount = {
      ...mockSubmittedCountWithExplanations,
      status: 'validated',
      validated_by: 'Jefe Salón',
    };

    assetsClient.getAssetCountForPeriod
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: mockSubmittedCountWithExplanations,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: validatedCount,
      });

    assetsClient.saveAssetExplanations.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: mockSubmittedCountWithExplanations,
    });
    assetsClient.validateAssetCount.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: validatedCount,
    });

    render(<AssetCountTab user={loungeHeadUser} />);

    expect(await screen.findByText('Listo para validar')).toBeInTheDocument();
    const validateBtn = screen.getByRole('button', { name: /Validar/i });
    expect(validateBtn).toBeInTheDocument();

    fireEvent.click(validateBtn);

    await waitFor(() => {
      expect(screen.getByText(/Conteo enviado: Salón/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Rotura en servicio')).toBeInTheDocument();
    });

    const confirmValidationBtn = screen.getByRole('button', { name: /Validar conteo/i });
    fireEvent.click(confirmValidationBtn);

    await waitFor(() => {
      expect(assetsClient.saveAssetExplanations).toHaveBeenCalledWith(
        5,
        expect.arrayContaining([expect.objectContaining({ asset_id: 1, explanation: 'Rotura en servicio' })])
      );
      expect(assetsClient.validateAssetCount).toHaveBeenCalledWith(5);
    });

    // Retorna a la pestaña y muestra el estado validado
    expect(await screen.findByText('Validado')).toBeInTheDocument();
    expect(screen.getByText('Jefe Salón')).toBeInTheDocument();
  });

  it('AssetCountSheet guarda borrador local por count.id y lo limpia al guardar', async () => {
    assetsClient.getAssetCountForPeriod.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: mockDraftCount,
    });
    assetsClient.saveAssetCountLines.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: mockDraftCount,
    });

    render(<AssetCountTab user={loungeStaffUser} />);

    fireEvent.click(await screen.findByRole('button', { name: /Seguir contando/i }));

    const inputs = await screen.findAllByPlaceholderText('0');
    fireEvent.change(inputs[0], { target: { value: '15' } });

    // Se guarda en localStorage con la clave ualdo_asset_draft_5
    expect(localStorage.getItem('ualdo_asset_draft_5')).toBeTruthy();

    const saveDraftBtn = screen.getByRole('button', { name: /Guardar borrador/i });
    fireEvent.click(saveDraftBtn);

    await waitFor(() => {
      expect(assetsClient.saveAssetCountLines).toHaveBeenCalledWith(
        5,
        expect.arrayContaining([expect.objectContaining({ asset_id: 1, counted_quantity: 15 })])
      );
      expect(localStorage.getItem('ualdo_asset_draft_5')).toBeNull();
    });
  });
});
