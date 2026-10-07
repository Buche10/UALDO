import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CashCloseManualForm from '../CashCloseManualForm';
import * as cashCloseClient from '../../../services/cashCloseClient';

describe('CashCloseManualForm component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('valida limites de fecha (no futura ni menor a 90 dias)', () => {
    render(<CashCloseManualForm initialFecha="2026-10-05" />);

    const dateInput = screen.getByLabelText(/Fecha de negocio/i);
    expect(dateInput).toHaveAttribute('min');
    expect(dateInput).toHaveAttribute('max');

    const max = dateInput.getAttribute('max');
    const todayStr = new Date().toISOString().slice(0, 10);
    expect(max).toBe(todayStr);
  });

  it('guarda exitosamente el cierre manual', async () => {
    const createSpy = vi.spyOn(cashCloseClient, 'createManualClose').mockResolvedValue({
      ok: true,
      status: 201,
      data: { fecha: '2026-10-05', efectivo: 250 }
    });

    const onSuccess = vi.fn();
    render(<CashCloseManualForm initialFecha="2026-10-05" onSuccess={onSuccess} />);

    const efectivoInput = screen.getByLabelText(/^Efectivo$/i);
    fireEvent.change(efectivoInput, { target: { value: '250,00' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar Cierre/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        fecha: '2026-10-05',
        efectivo: '250.00'
      }));
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('muestra mensaje y boton a detalle si la API responde 409 conflicto por foto de RunFood', async () => {
    vi.spyOn(cashCloseClient, 'createManualClose').mockResolvedValue({
      ok: false,
      status: 409,
      data: { message: 'Este cierre lo genera RunFood: usa la revisión del cierre.' }
    });

    const onSwitch = vi.fn();
    render(<CashCloseManualForm initialFecha="2026-10-05" onSwitchToDetail={onSwitch} />);

    fireEvent.click(screen.getByRole('button', { name: /Guardar Cierre/i }));

    await waitFor(() => {
      expect(screen.getByText(/Este cierre lo genera RunFood/i)).toBeInTheDocument();
    });

    const switchBtn = screen.getByRole('button', { name: /Ver cierre de RunFood/i });
    fireEvent.click(switchBtn);

    expect(onSwitch).toHaveBeenCalledWith('2026-10-05');
  });

  it('valida montos invalidos, envia observacion y permite cancelar', async () => {
    const createSpy = vi.spyOn(cashCloseClient, 'createManualClose').mockResolvedValue({
      ok: true,
      status: 201,
      data: { fecha: '2026-10-05' }
    });

    const onCancel = vi.fn();
    render(<CashCloseManualForm initialFecha="2026-10-05" onCancel={onCancel} />);

    // Monto invalido
    const efectivoInput = screen.getByLabelText(/^Efectivo$/i);
    fireEvent.change(efectivoInput, { target: { value: 'monto_invalido' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar Cierre/i }));

    expect(screen.getByText(/Monto inválido para efectivo/i)).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();

    // Corregir y agregar observacion
    fireEvent.change(efectivoInput, { target: { value: '100.00' } });
    const obsInput = screen.getByLabelText(/Observación/i);
    fireEvent.change(obsInput, { target: { value: 'Apertura tardia' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar Cierre/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        efectivo: '100.00',
        observacion: 'Apertura tardia'
      }));
    });

    // Cancelar
    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });

  it('muestra mensaje de error si la API responde 500', async () => {
    vi.spyOn(cashCloseClient, 'createManualClose').mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Error de base de datos'
    });

    render(<CashCloseManualForm initialFecha="2026-10-05" />);

    fireEvent.click(screen.getByRole('button', { name: /Guardar Cierre/i }));

    await waitFor(() => {
      expect(screen.getByText('Error de base de datos')).toBeInTheDocument();
    });
  });
});
