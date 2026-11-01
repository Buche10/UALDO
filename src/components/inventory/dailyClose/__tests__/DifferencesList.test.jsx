import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DifferencesList from '../DifferencesList';
import * as countsClient from '../../../../services/inventoryCountsClient';

describe('DifferencesList component (Brief 31p / 31p_fix)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockCount = {
    id: 15,
    location: 'kitchen',
    status: 'submitted',
    lines: [
      {
        id: 101,
        item_id: 1,
        item_name: 'Bife de chorizo',
        unit: 'kg',
        counted_quantity: 8,
        system_quantity: 10,
        difference: -2,
        explanation_cause: null,
        explanation: null,
      },
      {
        id: 102,
        item_id: 2,
        item_name: 'Vino tinto',
        unit: 'botella',
        counted_quantity: 5,
        system_quantity: 4,
        difference: 1,
        explanation_cause: 'error_de_conteo',
        explanation: '',
      },
      {
        id: 103,
        item_id: 3,
        item_name: 'Sal en grano',
        unit: 'kg',
        counted_quantity: 10,
        system_quantity: 10,
        difference: 0,
      },
    ],
  };

  it('muestra el mensaje respetuoso fijo y lista únicamente las líneas con diferencia', () => {
    render(<DifferencesList count={mockCount} canValidate={true} onBack={vi.fn()} />);

    expect(
      screen.getByText('Una diferencia no es una falta. Cuéntanos qué pasó para corregirlo.')
    ).toBeInTheDocument();

    expect(screen.getByText('Bife de chorizo')).toBeInTheDocument();
    expect(screen.getByText('-2 kg')).toBeInTheDocument();
    expect(screen.getByText('Vino tinto')).toBeInTheDocument();
    expect(screen.getByText('+1 botella')).toBeInTheDocument();
    expect(screen.queryByText('Sal en grano')).not.toBeInTheDocument();
  });

  it('Validar requiere explicaciones guardadas en el motor y avisa si hay cambios sin guardar (Requerimiento 3)', async () => {
    const saveSpy = vi.spyOn(countsClient, 'saveExplanations').mockResolvedValue({
      ok: true,
      data: {
        data: {
          ...mockCount,
          lines: [
            {
              ...mockCount.lines[0],
              explanation_cause: 'merma_no_registrada',
              explanation: '',
            },
            mockCount.lines[1],
            mockCount.lines[2],
          ],
        },
      },
    });

    const updateMock = vi.fn();
    const { rerender } = render(
      <DifferencesList
        count={mockCount}
        canValidate={true}
        onBack={vi.fn()}
        onCountUpdated={updateMock}
      />
    );

    // Inicialmente falta 1 explicación en el motor
    const validateBtn = screen.getByRole('button', { name: 'Validar' });
    expect(validateBtn).toBeDisabled();
    expect(screen.getByText(/Faltan 1 explicación para validar/i)).toBeInTheDocument();

    // Seleccionamos causa en el cliente sin guardar todavía
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'merma_no_registrada' } });

    // "Validar" DEBE seguir deshabilitado con aviso de guardar
    expect(validateBtn).toBeDisabled();
    expect(screen.getByText('Guarda las explicaciones antes de validar.')).toBeInTheDocument();

    // Guardamos las explicaciones
    const saveBtn = screen.getByRole('button', { name: /Guardar explicaciones/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith(15, [
        { item_id: 1, cause: 'merma_no_registrada', explanation: '' },
        { item_id: 2, cause: 'error_de_conteo', explanation: '' },
      ]);
      expect(updateMock).toHaveBeenCalled();
    });

    // Simulamos que el componente padre pasa el count actualizado devuelto por el motor
    const updatedCount = {
      ...mockCount,
      lines: [
        {
          ...mockCount.lines[0],
          explanation_cause: 'merma_no_registrada',
          explanation: '',
        },
        mockCount.lines[1],
        mockCount.lines[2],
      ],
    };

    rerender(
      <DifferencesList
        count={updatedCount}
        canValidate={true}
        onBack={vi.fn()}
        onCountUpdated={updateMock}
      />
    );

    // Ahora sí está habilitado para validar
    expect(validateBtn).not.toBeDisabled();
    expect(screen.getByText('Todas las diferencias tienen causa.')).toBeInTheDocument();
  });

  it('valida con confirmación en dos pasos mostrando el número de diferencias', async () => {
    const fullyExplainedCount = {
      ...mockCount,
      lines: [
        { ...mockCount.lines[0], explanation_cause: 'merma_no_registrada' },
        mockCount.lines[1],
        mockCount.lines[2],
      ],
    };

    const validateSpy = vi.spyOn(countsClient, 'validateCount').mockResolvedValue({
      ok: true,
      data: { data: { id: 15, status: 'validated' } },
    });
    const backMock = vi.fn();

    render(<DifferencesList count={fullyExplainedCount} canValidate={true} onBack={backMock} />);

    const validateBtn = screen.getByRole('button', { name: 'Validar' });
    expect(validateBtn).not.toBeDisabled();
    fireEvent.click(validateBtn);

    // Modal de confirmación
    expect(await screen.findByText('¿Confirmar validación?')).toBeInTheDocument();
    expect(screen.getByText(/Se ajustará el inventario por 2 diferencias/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar validación' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(validateSpy).toHaveBeenCalledWith(15);
      expect(backMock).toHaveBeenCalled();
    });
  });

  it('en estado validated se muestra en solo lectura (Requerimiento 4)', () => {
    const validatedCount = {
      ...mockCount,
      status: 'validated',
      lines: [
        { ...mockCount.lines[0], explanation_cause: 'merma_no_registrada' },
        mockCount.lines[1],
      ],
    };

    render(<DifferencesList count={validatedCount} canValidate={true} onBack={vi.fn()} />);

    // No debe haber botones de guardar, validar ni escalar
    expect(screen.queryByRole('button', { name: /Guardar explicaciones/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Validar$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Escalar a administración/i })).toBeNull();

    // Las causas se muestran como texto, no como select
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getByText('Merma no registrada')).toBeInTheDocument();
    expect(screen.getByText('Error de conteo')).toBeInTheDocument();
  });

  it('el botón Corregir conteo invoca onOpenEditSheet para volver a la planilla', () => {
    const openSheetMock = vi.fn();
    render(
      <DifferencesList
        count={mockCount}
        canValidate={true}
        onBack={vi.fn()}
        onOpenEditSheet={openSheetMock}
      />
    );

    const editBtn = screen.getByRole('button', { name: /Corregir conteo/i });
    fireEvent.click(editBtn);

    expect(openSheetMock).toHaveBeenCalled();
  });

  it('escalar a administración exige nota y llama a escalateCount', async () => {
    const escalateSpy = vi.spyOn(countsClient, 'escalateCount').mockResolvedValue({
      ok: true,
      data: { data: { id: 15, status: 'escalated' } },
    });
    const backMock = vi.fn();

    render(<DifferencesList count={mockCount} canValidate={true} onBack={backMock} />);

    const openEscalateBtn = screen.getByRole('button', { name: /Escalar a administración/i });
    fireEvent.click(openEscalateBtn);

    expect(await screen.findByRole('heading', { name: 'Escalar a administración' })).toBeInTheDocument();

    const confirmEscalateBtn = screen.getByRole('button', { name: /Confirmar escalamiento/i });
    expect(confirmEscalateBtn).toBeDisabled();

    const textarea = screen.getByPlaceholderText(/Diferencia de bife sin aclarar/i);
    fireEvent.change(textarea, { target: { value: 'Falta justificar el faltante de bife' } });

    expect(confirmEscalateBtn).not.toBeDisabled();
    fireEvent.click(confirmEscalateBtn);

    await waitFor(() => {
      expect(escalateSpy).toHaveBeenCalledWith(15, 'Falta justificar el faltante de bife');
      expect(backMock).toHaveBeenCalled();
    });
  });
});
