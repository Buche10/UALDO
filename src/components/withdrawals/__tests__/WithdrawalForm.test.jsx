import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WithdrawalForm from '../WithdrawalForm';
import * as withdrawalsClient from '../../../services/withdrawalsClient';

vi.mock('../../../hooks/useItemSearch', () => ({
  useItemSearch: vi.fn((term) => ({
    results: term && term.length >= 2 ? [{ id: 10, name: 'Azúcar refinada', unit: 'kg' }] : [],
    searching: false,
    failed: false,
  })),
}));

describe('WithdrawalForm (Brief 32p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('permite buscar y seleccionar un insumo, ingresar cantidad y declarar con éxito', async () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    const createSpy = vi.spyOn(withdrawalsClient, 'createWithdrawal').mockResolvedValue({
      ok: true,
      data: { id: 123, status: 'open' },
    });

    render(<WithdrawalForm user={{ id: 5, area: 'kitchen' }} onSuccess={onSuccess} onCancel={onCancel} />);

    // Buscar insumo
    const searchInput = screen.getByPlaceholderText(/Escribe el nombre del insumo/i);
    fireEvent.change(searchInput, { target: { value: 'Azúcar' } });

    // Seleccionar de la lista desplegable
    const optionBtn = await screen.findByText('Azúcar refinada');
    fireEvent.click(optionBtn);

    // Ingresar cantidad
    const qtyInput = screen.getByPlaceholderText('0.000');
    fireEvent.change(qtyInput, { target: { value: '2.5' } });

    // Seleccionar chip de sugerencia de motivo
    fireEvent.click(screen.getByText('Mise en place'));

    // Enviar
    fireEvent.click(screen.getByRole('button', { name: /Declarar retiro/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ item_id: 10, name: 'Azúcar refinada', quantity: '2.5' }],
          to_location: 'kitchen',
          purpose: 'Mise en place',
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('valida que no se declare sin seleccionar todos los insumos', async () => {
    render(<WithdrawalForm user={{ id: 5 }} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    // Iniciar con insumo vacío
    fireEvent.click(screen.getByRole('button', { name: /Declarar retiro/i }));

    expect(
      await screen.findByText(/Selecciona todos los insumos de la lista antes de declarar/i)
    ).toBeInTheDocument();
  });

  it('muestra el error 422 de stock insuficiente en la línea del insumo correspondiente', async () => {
    vi.spyOn(withdrawalsClient, 'createWithdrawal').mockResolvedValue({
      ok: false,
      status: 422,
      error: 'En el sistema no hay suficiente Azúcar refinada en Bodega (1.000 kg). Avisa a tu jefe.',
      lineErrors: {
        10: ['En el sistema no hay suficiente Azúcar refinada en Bodega (1.000 kg). Avisa a tu jefe.'],
      },
    });

    render(<WithdrawalForm user={{ id: 5 }} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    // Seleccionar insumo
    const searchInput = screen.getByPlaceholderText(/Escribe el nombre del insumo/i);
    fireEvent.change(searchInput, { target: { value: 'Azúcar' } });
    fireEvent.click(await screen.findByText('Azúcar refinada'));

    // Ingresar motivo
    const purposeInput = screen.getByLabelText(/Motivo del retiro \(3 a 200 caracteres\)/i);
    fireEvent.change(purposeInput, { target: { value: 'Postres' } });

    // Enviar
    fireEvent.click(screen.getByRole('button', { name: /Declarar retiro/i }));

    await waitFor(() => {
      expect(
        screen.getAllByText(/En el sistema no hay suficiente Azúcar refinada en Bodega/i).length
      ).toBeGreaterThanOrEqual(1);
    });
  });

  it('permite marcar retiro tardío con hora y motivo', async () => {
    const createSpy = vi.spyOn(withdrawalsClient, 'createWithdrawal').mockResolvedValue({
      ok: true,
      data: { id: 124 },
    });

    render(<WithdrawalForm user={{ id: 5 }} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    // Insumo
    const searchInput = screen.getByPlaceholderText(/Escribe el nombre del insumo/i);
    fireEvent.change(searchInput, { target: { value: 'Azúcar' } });
    fireEvent.click(await screen.findByText('Azúcar refinada'));

    // Checkbox retiro tardío
    const lateCheckbox = screen.getByLabelText(/Lo retiré antes de avisar/i);
    fireEvent.click(lateCheckbox);

    // Campos tardíos
    const lateReasonInput = screen.getByLabelText(/Motivo del retiro tardío/i);
    fireEvent.change(lateReasonInput, { target: { value: 'Urgencia durante el servicio' } });

    const purposeInput = screen.getByLabelText(/Motivo del retiro \(3 a 200 caracteres\)/i);
    fireEvent.change(purposeInput, { target: { value: 'Postres del día' } });

    fireEvent.click(screen.getByRole('button', { name: /Declarar retiro/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          late_reason: 'Urgencia durante el servicio',
        })
      );
    });
  });

  it('agrega y quita líneas de insumos respetando los límites', () => {
    render(<WithdrawalForm user={{ id: 5 }} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText('Insumo #1')).toBeInTheDocument();
    expect(screen.queryByLabelText('Quitar insumo 1')).not.toBeInTheDocument();

    // Agregar segundo insumo
    const addBtn = screen.getByRole('button', { name: /Añadir otro insumo/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Insumo #2')).toBeInTheDocument();

    // Quitar insumo 2
    const removeBtn = screen.getByLabelText('Quitar insumo 2');
    fireEvent.click(removeBtn);

    expect(screen.queryByText('Insumo #2')).not.toBeInTheDocument();
  });
});
