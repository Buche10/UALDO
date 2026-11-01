import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DifferencesList from '../DifferencesList';
import * as countsClient from '../../../../services/inventoryCountsClient';

describe('DifferencesList component (Brief 31p)', () => {
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
        difference: 0, // Sin diferencia -> no se muestra en la lista
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

  it('deshabilita el botón Validar mientras falten explicaciones y lo habilita al completarlas', async () => {
    render(<DifferencesList count={mockCount} canValidate={true} onBack={vi.fn()} />);

    // Bife de chorizo no tiene causa asignada (falta 1)
    const validateBtn = screen.getByRole('button', { name: 'Validar' });
    expect(validateBtn).toBeDisabled();
    expect(screen.getByText(/Faltan 1 explicaciones para validar/i)).toBeInTheDocument();

    // Seleccionamos causa para Bife de chorizo
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'merma_no_registrada' } });

    await waitFor(() => {
      expect(validateBtn).not.toBeDisabled();
      expect(screen.getByText('Todas las diferencias tienen causa.')).toBeInTheDocument();
    });
  });

  it('valida con confirmación en dos pasos mostrando el número de diferencias', async () => {
    const validateSpy = vi.spyOn(countsClient, 'validateCount').mockResolvedValue({
      ok: true,
      data: { data: { id: 15, status: 'validated' } },
    });
    const backMock = vi.fn();

    render(<DifferencesList count={mockCount} canValidate={true} onBack={backMock} />);

    // Completamos la causa que falta
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'merma_no_registrada' } });

    const validateBtn = screen.getByRole('button', { name: 'Validar' });
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
