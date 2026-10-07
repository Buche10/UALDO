import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CashCloseClosedActions from '../CashCloseClosedActions';
import * as cashCloseClient from '../../../services/cashCloseClient';

describe('CashCloseClosedActions component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockCierre = {
    fecha: '2026-10-05',
    status: 'cerrado',
    tarjeta_neto: null,
    diners_neto: null,
    pedidos_ya_neto: null
  };

  it('no envia netos reales si todos estan vacios y muestra error', async () => {
    const setNetosSpy = vi.spyOn(cashCloseClient, 'setNetosReales');
    render(<CashCloseClosedActions cierre={mockCierre} onUpdated={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /Cargar netos del banco/i }));

    const submitBtn = screen.getByRole('button', { name: /Guardar Netos/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Debes ingresar al menos un valor de neto real/i)).toBeInTheDocument();
    expect(setNetosSpy).not.toHaveBeenCalled();
  });

  it('envia al menos un neto real y actualiza el detalle', async () => {
    const setNetosSpy = vi.spyOn(cashCloseClient, 'setNetosReales').mockResolvedValue({
      ok: true,
      status: 200,
      data: { fecha: '2026-10-05', tarjeta_neto: 105.2 }
    });

    const onUpdated = vi.fn();
    render(<CashCloseClosedActions cierre={mockCierre} onUpdated={onUpdated} />);

    fireEvent.click(screen.getByRole('button', { name: /Cargar netos del banco/i }));

    const tarjetaInput = screen.getByLabelText(/Tarjeta neto/i);
    fireEvent.change(tarjetaInput, { target: { value: '105.20' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar Netos/i }));

    await waitFor(() => {
      expect(setNetosSpy).toHaveBeenCalledWith('2026-10-05', {
        tarjeta_neto: '105.20'
      });
    });
    expect(onUpdated).toHaveBeenCalled();
  });

  it('muestra mensaje del servidor si reabrir responde 409', async () => {
    const reopenSpy = vi.spyOn(cashCloseClient, 'reopenClose').mockResolvedValue({
      ok: false,
      status: 409,
      data: { message: 'Solo se puede reabrir un cierre cerrado.' }
    });

    render(<CashCloseClosedActions cierre={mockCierre} onUpdated={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /Reabrir el día/i }));

    const textarea = screen.getByPlaceholderText(/Indica el motivo/i);
    fireEvent.change(textarea, { target: { value: 'Error en conteo reportado tarde' } });

    fireEvent.click(screen.getByRole('button', { name: /Reabrir Cierre/i }));

    await waitFor(() => {
      expect(screen.getByText('Solo se puede reabrir un cierre cerrado.')).toBeInTheDocument();
    });
    expect(reopenSpy).toHaveBeenCalled();
  });

  it('valida monto invalido en netos, motivo largo en reapertura y cancelacion de modales', async () => {
    const setNetosSpy = vi.spyOn(cashCloseClient, 'setNetosReales');
    const reopenSpy = vi.spyOn(cashCloseClient, 'reopenClose');

    render(<CashCloseClosedActions cierre={{ ...mockCierre, tarjeta_neto: 100 }} onUpdated={() => {}} />);

    // Abrir modal de netos
    fireEvent.click(screen.getByRole('button', { name: /Cargar netos del banco/i }));

    // Monto invalido
    const dinersInput = screen.getByLabelText(/Diners neto/i);
    fireEvent.change(dinersInput, { target: { value: 'monto_malo' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar Netos/i }));

    expect(screen.getByText(/Monto inválido para diners neto/i)).toBeInTheDocument();
    expect(setNetosSpy).not.toHaveBeenCalled();

    // Cancelar modal
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(screen.queryByText(/Cargar Netos Reales/i)).not.toBeInTheDocument();

    // Abrir modal de reapertura
    fireEvent.click(screen.getByRole('button', { name: /Reabrir el día/i }));
    const textarea = screen.getByPlaceholderText(/Indica el motivo/i);

    // Motivo > 300 caracteres
    fireEvent.change(textarea, { target: { value: 'a'.repeat(301) } });
    fireEvent.click(screen.getByRole('button', { name: /Reabrir Cierre/i }));

    expect(screen.getByText(/El motivo no debe superar 300 caracteres/i)).toBeInTheDocument();
    expect(reopenSpy).not.toHaveBeenCalled();

    // Cancelar modal
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(screen.queryByText(/El día volverá a revisión/i)).not.toBeInTheDocument();
  });

  it('valida motivo vacio al reabrir, gestiona reapertura exitosa y error en netos', async () => {
    const onUpdated = vi.fn();
    const reopenSpy = vi.spyOn(cashCloseClient, 'reopenClose').mockResolvedValue({
      ok: true,
      status: 200,
      data: { fecha: '2026-10-05', status: 'revision' }
    });

    render(<CashCloseClosedActions cierre={mockCierre} onUpdated={onUpdated} />);

    // Reapertura con motivo vacio
    fireEvent.click(screen.getByRole('button', { name: /Reabrir el día/i }));
    const reopenSubmitBtn = screen.getByRole('button', { name: /Reabrir Cierre/i });
    expect(reopenSubmitBtn).toBeDisabled();

    // Llenar motivo valido
    const textarea = screen.getByPlaceholderText(/Indica el motivo/i);
    fireEvent.change(textarea, { target: { value: 'Ajuste de arqueo autorizado' } });
    expect(reopenSubmitBtn).not.toBeDisabled();
    fireEvent.click(reopenSubmitBtn);

    await waitFor(() => {
      expect(reopenSpy).toHaveBeenCalledWith('2026-10-05', 'Ajuste de arqueo autorizado');
      expect(onUpdated).toHaveBeenCalled();
    });

    // Error en setNetosReales
    vi.spyOn(cashCloseClient, 'setNetosReales').mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Error al persistir netos'
    });

    fireEvent.click(screen.getByRole('button', { name: /Cargar netos del banco/i }));
    fireEvent.change(screen.getByLabelText(/Tarjeta neto/i), { target: { value: '50.00' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar Netos/i }));

    await waitFor(() => {
      expect(screen.getByText('Error al persistir netos')).toBeInTheDocument();
    });
  });
});
