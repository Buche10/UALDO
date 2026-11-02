import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AssetCatalogTab from '../AssetCatalogTab';
import * as assetsClient from '../../../services/assetsClient';

vi.mock('../../../services/assetsClient', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    listAssets: vi.fn(),
    createAsset: vi.fn(),
    updateAsset: vi.fn(),
    setAssetStatus: vi.fn(),
    importAssets: vi.fn(),
  };
});

describe('AssetCatalogTab (Brief 38p)', () => {
  const sampleAssets = [
    {
      id: 1,
      name: 'Copa de agua',
      code: 'CRI-01',
      category: 'cristaleria',
      expected_quantity: 40,
      min_quantity: 10,
      status: 'activo',
      open_incidents: 0,
      broken_last_30_days: 2,
      below_minimum: false,
    },
    {
      id: 2,
      name: 'Plato llano',
      code: 'VAJ-01',
      category: 'vajilla',
      expected_quantity: 5,
      min_quantity: 12,
      status: 'activo',
      open_incidents: 1,
      broken_last_30_days: 0,
      below_minimum: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    assetsClient.listAssets.mockResolvedValue({
      ok: true,
      data: sampleAssets,
    });
  });

  it('renders assets catalog with status, open incidents and below minimum notice', async () => {
    render(<AssetCatalogTab user={{ role: 'staff' }} canManage={false} />);

    await waitFor(() => {
      expect(screen.getByText('Copa de agua')).toBeInTheDocument();
      expect(screen.getByText('Plato llano')).toBeInTheDocument();
    });

    expect(screen.getByText('Bajo mínimo')).toBeInTheDocument();
    expect(screen.getByText(/1 avería\(s\)/i)).toBeInTheDocument();
    expect(screen.getByText(/2 rotas \(30d\)/i)).toBeInTheDocument();

    // Without settings.manage: no create, import, edit or status buttons
    expect(screen.queryByText(/Nuevo activo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Importar/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Editar Copa de agua/i)).not.toBeInTheDocument();
  });

  it('with canManage: renders action buttons and allows editing asset requiring a reason if expected quantity changes', async () => {
    render(<AssetCatalogTab user={{ role: 'admin' }} canManage={true} />);

    await waitFor(() => {
      expect(screen.getByText('Copa de agua')).toBeInTheDocument();
    });

    expect(screen.getByText(/Nuevo activo/i)).toBeInTheDocument();
    expect(screen.getByText(/Importar/i)).toBeInTheDocument();

    // Click edit on Copa de agua
    const editBtn = screen.getByLabelText(/Editar Copa de agua/i);
    fireEvent.click(editBtn);

    expect(screen.getByText('Editar activo')).toBeInTheDocument();

    // Change expected quantity from 40 to 45
    const expInput = screen.getByLabelText(/cantidad esperada/i);
    fireEvent.change(expInput, { target: { value: '45' } });

    // Try submitting without reason
    fireEvent.click(screen.getByText('Guardar cambios'));

    await waitFor(() => {
      expect(screen.getByText(/Debes indicar un motivo para cambiar la cantidad esperada/i)).toBeInTheDocument();
    });

    // Provide reason
    const reasonInput = screen.getByLabelText(/motivo del cambio de cantidad/i);
    fireEvent.change(reasonInput, { target: { value: 'Compra de 5 copas de reposición' } });

    assetsClient.updateAsset.mockResolvedValueOnce({
      ok: true,
      data: { ...sampleAssets[0], expected_quantity: 45 },
    });

    fireEvent.click(screen.getByText('Guardar cambios'));

    await waitFor(() => {
      expect(assetsClient.updateAsset).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ expected_quantity: 45 }),
        'Compra de 5 copas de reposición'
      );
    });
  });

  it('allows importing assets via CSV with motor error display', async () => {
    render(<AssetCatalogTab user={{ role: 'admin' }} canManage={true} />);

    await waitFor(() => {
      expect(screen.getByText('Copa de agua')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Importar/i));
    expect(screen.getByText('Importar activos por CSV')).toBeInTheDocument();

    // Paste CSV
    const csvInput = screen.getByLabelText(/O pega el texto CSV:/i);
    fireEvent.change(csvInput, {
      target: {
        value: `categoria,nombre,codigo,esperado,minimo\nvajilla,Taza,VAJ-09,15,5`,
      },
    });

    expect(screen.getByText(/activos listos para importar/i)).toBeInTheDocument();

    // Mock motor 422 error
    assetsClient.importAssets.mockResolvedValueOnce({
      ok: false,
      status: 422,
      data: {
        errors: {
          'rows.0.code': ['El código ya está en uso.'],
        },
      },
    });

    fireEvent.click(screen.getByText(/Importar 1 activos/i));

    await waitFor(() => {
      expect(screen.getByText(/Fila 1 \(code\): El código ya está en uso\./i)).toBeInTheDocument();
    });
  });

  it('allows changing asset status via AssetStatusModal', async () => {
    render(<AssetCatalogTab user={{ role: 'admin' }} canManage={true} />);

    await waitFor(() => {
      expect(screen.getByText('Copa de agua')).toBeInTheDocument();
    });

    const statusBtn = screen.getByLabelText(/Cambiar estado de Copa de agua/i);
    fireEvent.click(statusBtn);

    expect(screen.getByText('Cambiar estado de activo')).toBeInTheDocument();

    const statusSelect = screen.getByLabelText(/Nuevo estado/i);
    fireEvent.change(statusSelect, { target: { value: 'fuera_de_servicio' } });

    const reasonInput = screen.getByLabelText(/Motivo \(opcional\)/i);
    fireEvent.change(reasonInput, { target: { value: 'En mantenimiento preventivo' } });

    assetsClient.setAssetStatus.mockResolvedValueOnce({
      ok: true,
      data: { ...sampleAssets[0], status: 'fuera_de_servicio' },
    });

    fireEvent.click(screen.getByText('Actualizar estado'));

    await waitFor(() => {
      expect(assetsClient.setAssetStatus).toHaveBeenCalledWith(
        1,
        'fuera_de_servicio',
        'En mantenimiento preventivo'
      );
    });
  });
});
