import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CommissionRatesPanel from '../CommissionRatesPanel';
import * as cashConfigClient from '../../../services/cashConfigClient';

describe('CommissionRatesPanel component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockRates = {
    current: [
      {
        card_type: 'credito',
        label: 'Crédito',
        rate_bp: 448,
        retention_bp: 200,
        effective_from: '2026-10-01'
      },
      {
        card_type: 'debito',
        label: 'Débito',
        rate_bp: null,
        retention_bp: null,
        effective_from: null
      },
      {
        card_type: 'diners',
        label: 'Diners',
        rate_bp: null,
        retention_bp: null,
        effective_from: null
      },
      {
        card_type: 'pedidos_ya',
        label: 'Pedidos Ya',
        rate_bp: 1500,
        retention_bp: 0,
        effective_from: '2026-09-15'
      }
    ],
    history: [
      {
        id: 1,
        card_type: 'credito',
        rate_bp: 450,
        retention_bp: 200,
        effective_from: '2026-08-01'
      }
    ]
  };

  it('muestra "Sin tasa: su neto queda pendiente" para tarjetas sin tasa y no prellena el formulario', async () => {
    vi.spyOn(cashConfigClient, 'getCommissionRates').mockResolvedValue({
      ok: true,
      status: 200,
      data: mockRates
    });

    render(<CommissionRatesPanel />);

    await waitFor(() => {
      expect(screen.getByText('Crédito')).toBeInTheDocument();
    });

    const pendingBadges = screen.getAllByText('Sin tasa: su neto queda pendiente');
    expect(pendingBadges.length).toBe(2); // debito y diners

    // Comprobar la nota fija
    expect(screen.getByText(/La retención se calcula sobre el bruto\. Confírmalo con tu contador\./i)).toBeInTheDocument();

    // Abrir "Nueva tasa" para Débito
    const newRateButtons = screen.getAllByRole('button', { name: /Nueva tasa/i });
    fireEvent.click(newRateButtons[1]); // Débito

    // Comprobar que los inputs NO estan prellenados con el ejemplo (deben estar vacíos)
    const rateInput = screen.getByLabelText(/Comisión %/i);
    const retentionInput = screen.getByLabelText(/Retención %/i);
    expect(rateInput.value).toBe('');
    expect(retentionInput.value).toBe('');
  });

  it('valida campos, pide confirmación mostrando los porcentajes y envía puntos básicos', async () => {
    vi.spyOn(cashConfigClient, 'getCommissionRates').mockResolvedValue({
      ok: true,
      status: 200,
      data: mockRates
    });

    const saveSpy = vi.spyOn(cashConfigClient, 'saveCommissionRate').mockResolvedValue({
      ok: true,
      status: 200,
      data: mockRates
    });

    render(<CommissionRatesPanel />);

    await waitFor(() => {
      expect(screen.getByText('Crédito')).toBeInTheDocument();
    });

    const newRateButtons = screen.getAllByRole('button', { name: /Nueva tasa/i });
    fireEvent.click(newRateButtons[0]); // Crédito

    await waitFor(() => {
      expect(screen.getByText('Nueva Tasa para Crédito')).toBeInTheDocument();
    });

    const rateInput = screen.getByLabelText(/Comisión %/i);
    const retentionInput = screen.getByLabelText(/Retención %/i);

    // El formulario no viene prellenado con ejemplos
    expect(rateInput.value).toBe('');
    expect(retentionInput.value).toBe('');

    // Ingresar valores con coma y punto
    fireEvent.change(rateInput, { target: { value: '4,48' } });
    fireEvent.change(retentionInput, { target: { value: '2' } });
    const dateInput = screen.getByLabelText(/Vigente desde/i);
    fireEvent.change(dateInput, { target: { value: '2026-10-07' } });

    // Continuar a confirmacion
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    // Diálogo de confirmación
    await waitFor(() => {
      expect(screen.getByText(/¿Confirmas guardar la tasa de/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirmar y guardar' })).toBeInTheDocument();
    });

    // Guardar
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y guardar' }));

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({
        card_type: 'credito',
        rate_bp: 448,
        retention_bp: 200
      }));
      expect(screen.getByText(/Tasa guardada correctamente/i)).toBeInTheDocument();
    });
  });

  it('muestra modal de historial en modo solo lectura', async () => {
    vi.spyOn(cashConfigClient, 'getCommissionRates').mockResolvedValue({
      ok: true,
      status: 200,
      data: mockRates
    });

    render(<CommissionRatesPanel />);

    await waitFor(() => {
      expect(screen.getByText('Crédito')).toBeInTheDocument();
    });

    const historyButtons = screen.getAllByRole('button', { name: /Historial/i });
    fireEvent.click(historyButtons[0]); // Crédito

    await waitFor(() => {
      expect(screen.getByText('Historial de Crédito')).toBeInTheDocument();
      expect(screen.getByText(/Desde 2026-08-01/i)).toBeInTheDocument();
      expect(screen.getByText(/4,50 %/i)).toBeInTheDocument();
    });

    // Cerrar modal
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByText('Historial de Crédito')).not.toBeInTheDocument();
  });

  it('muestra errores del servidor 422 por campo', async () => {
    vi.spyOn(cashConfigClient, 'getCommissionRates').mockResolvedValue({
      ok: true,
      status: 200,
      data: mockRates
    });

    vi.spyOn(cashConfigClient, 'saveCommissionRate').mockResolvedValue({
      ok: false,
      status: 422,
      data: {
        message: 'Datos no válidos.',
        errors: {
          rate_bp: ['La tasa excede el máximo permitido.']
        }
      }
    });

    render(<CommissionRatesPanel />);

    await waitFor(() => {
      expect(screen.getByText('Crédito')).toBeInTheDocument();
    });

    const newRateButtons = screen.getAllByRole('button', { name: /Nueva tasa/i });
    fireEvent.click(newRateButtons[0]);

    fireEvent.change(screen.getByLabelText(/Comisión %/i), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/Retención %/i), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => {
      expect(screen.getByText(/¿Confirmas guardar la tasa de/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y guardar' }));

    await waitFor(() => {
      expect(screen.getByText('La tasa excede el máximo permitido.')).toBeInTheDocument();
    });
  });
});
