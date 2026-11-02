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
    createAssetCount: vi.fn(),
    saveAssetCountLines: vi.fn(),
    submitAssetCount: vi.fn(),
    saveAssetExplanations: vi.fn(),
    validateAssetCount: vi.fn(),
  };
});

describe('AssetCountTab (Brief 38p)', () => {
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
      { id: 101, asset_id: 1, asset_name: 'Copa de agua', expected_quantity: 40, counted_quantity: null },
      { id: 102, asset_id: 2, asset_name: 'Plato llano', expected_quantity: 20, counted_quantity: null },
    ],
  };

  const mockSubmittedCount = {
    id: 5,
    area: 'lounge',
    period: '2026-11',
    status: 'submitted',
    lines: [
      { id: 101, asset_id: 1, asset_name: 'Copa de agua', expected_quantity: 40, counted_quantity: 38, difference: -2, explanation: null },
      { id: 102, asset_id: 2, asset_name: 'Plato llano', expected_quantity: 20, counted_quantity: 20, difference: 0, explanation: null },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('starts count and does NOT display expected quantity before submitting to prevent bias', async () => {
    assetsClient.createAssetCount.mockResolvedValueOnce({
      ok: true,
      data: mockDraftCount,
    });
    assetsClient.saveAssetCountLines.mockResolvedValue({ ok: true, data: mockDraftCount });

    render(<AssetCountTab user={loungeStaffUser} />);

    // Click "Empezar conteo"
    fireEvent.click(screen.getByText('Empezar conteo'));

    await waitFor(() => {
      expect(screen.getByText(/Planilla de conteo: Salón/i)).toBeInTheDocument();
      expect(screen.getByText('Copa de agua')).toBeInTheDocument();
      expect(screen.getByText('Plato llano')).toBeInTheDocument();
    });

    // Verify expected quantities (40 and 20) are NOT displayed on the sheet
    expect(screen.queryByText('40')).not.toBeInTheDocument();
    expect(screen.queryByText('20')).not.toBeInTheDocument();

    // Type counted quantity
    const inputs = screen.getAllByPlaceholderText('0');
    fireEvent.change(inputs[0], { target: { value: '38' } });
    fireEvent.change(inputs[1], { target: { value: '20' } });

    // Submit count
    assetsClient.submitAssetCount.mockResolvedValueOnce({
      ok: true,
      data: mockSubmittedCount,
    });

    fireEvent.click(screen.getByText(/Enviar conteo/i));

    await waitFor(() => {
      expect(assetsClient.submitAssetCount).toHaveBeenCalledWith(5);
    });
  });

  it('requires explanation for differences and allows only area head to validate', async () => {
    // Put submitted count into storage
    localStorage.setItem('ualdo_asset_count_lounge_2026-11', JSON.stringify(mockSubmittedCount));

    // Render for staff (has no ASSETS_VALIDATE_LOUNGE)
    const { rerender } = render(<AssetCountTab user={loungeStaffUser} />);

    await waitFor(() => {
      expect(screen.getByText(/Conteo enviado: Salón/i)).toBeInTheDocument();
      expect(screen.getByText(/Diferencia: -2/i)).toBeInTheDocument();
      expect(screen.getByText('Exacto')).toBeInTheDocument();
    });

    // Staff cannot validate: no "Validar conteo" button
    expect(screen.queryByText(/Validar conteo/i)).not.toBeInTheDocument();

    // Rerender for area head
    rerender(<AssetCountTab user={loungeHeadUser} />);

    const validateBtn = screen.getByText('Validar conteo');
    expect(validateBtn).toBeInTheDocument();
    expect(validateBtn).toBeDisabled(); // Disabled because difference is not explained yet

    // Provide explanation
    const expInput = screen.getByPlaceholderText(/Motivo de la diferencia/i);
    fireEvent.change(expInput, { target: { value: 'Dos copas se rompieron durante el turno del viernes.' } });

    // Validate button should become enabled
    expect(validateBtn).not.toBeDisabled();

    assetsClient.saveAssetExplanations.mockResolvedValueOnce({
      ok: true,
      data: {
        ...mockSubmittedCount,
        lines: [
          { ...mockSubmittedCount.lines[0], explanation: 'Dos copas se rompieron durante el turno del viernes.' },
          mockSubmittedCount.lines[1],
        ],
      },
    });

    assetsClient.validateAssetCount.mockResolvedValueOnce({
      ok: true,
      data: {
        ...mockSubmittedCount,
        status: 'validated',
        validated_by: 'Lucía',
      },
    });

    fireEvent.click(validateBtn);

    await waitFor(() => {
      expect(assetsClient.saveAssetExplanations).toHaveBeenCalledWith(
        5,
        expect.arrayContaining([
          expect.objectContaining({ asset_id: 1, explanation: 'Dos copas se rompieron durante el turno del viernes.' }),
        ])
      );
      expect(assetsClient.validateAssetCount).toHaveBeenCalledWith(5);
      expect(screen.getByText(/Conteo del periodo validado/i)).toBeInTheDocument();
    });
  });
});
