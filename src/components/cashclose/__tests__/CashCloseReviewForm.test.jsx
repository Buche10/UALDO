import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CashCloseReviewForm from '../CashCloseReviewForm';
import * as cashCloseClient from '../../../services/cashCloseClient';

describe('CashCloseReviewForm component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockCierre = {
    fecha: '2026-10-05',
    status: 'revision',
    efectivo_contado: 120.0,
    tarjeta_neto: null,
    diners_neto: null,
    pedidos_ya_neto: null,
    pedidos_ya: null,
    decoracion_efectivo: null,
    decoracion_tarjeta: null,
    decoracion_transferencia: null,
    observacion: 'Nota previa'
  };

  it('envia solo las claves cambiadas y montos como texto normalizado al guardar', async () => {
    const reviewSpy = vi.spyOn(cashCloseClient, 'reviewClose').mockResolvedValue({
      ok: true,
      status: 200,
      data: { fecha: '2026-10-05' }
    });

    const onUpdated = vi.fn();
    render(<CashCloseReviewForm cierre={mockCierre} onUpdated={onUpdated} />);

    // Modificamos solo tarjeta_neto con coma decimal
    const tarjetaInput = screen.getByLabelText(/Tarjeta neto/i);
    fireEvent.change(tarjetaInput, { target: { value: '95,50' } });

    // Guardar (sin confirmar)
    const saveBtn = screen.getByRole('button', { name: /^Guardar$/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(reviewSpy).toHaveBeenCalledWith('2026-10-05', {
        tarjeta_neto: '95.50'
      });
    });
    expect(onUpdated).toHaveBeenCalled();
  });

  it('muestra modal con fallas ante un 422 y permite forzar cierre con motivo valido', async () => {
    // Primer intento con confirmar: responde 422 con fallas
    const reviewSpy = vi.spyOn(cashCloseClient, 'reviewClose')
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        data: {
          message: 'El cierre no cuadra',
          fallas: [{ tipo: 'diferencia_efectivo', motivo: 'Diferencia de USD -12.40' }]
        }
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { fecha: '2026-10-05', status: 'cerrado' }
      });

    const onUpdated = vi.fn();
    const onReload = vi.fn();
    render(<CashCloseReviewForm cierre={mockCierre} onUpdated={onUpdated} onReload={onReload} />);

    // Clic en "Guardar y cerrar el día"
    fireEvent.click(screen.getByRole('button', { name: /Guardar y cerrar el día/i }));

    await waitFor(() => {
      expect(screen.getByText('El cierre no cuadra')).toBeInTheDocument();
      expect(screen.getByText('Diferencia de USD -12.40')).toBeInTheDocument();
    });
    expect(onReload).toHaveBeenCalled();

    // Clic en "Cerrar de todas formas"
    fireEvent.click(screen.getByRole('button', { name: /Cerrar de todas formas/i }));

    // Intentar forzar con motivo de 9 caracteres (debe bloquearse)
    const textarea = screen.getByPlaceholderText(/Explica por qué se fuerza/i);
    fireEvent.change(textarea, { target: { value: '123456789' } }); // 9 chars
    const confirmForceBtn = screen.getByRole('button', { name: /Confirmar y Forzar/i });
    expect(confirmForceBtn).toBeDisabled();

    // Ahora motivo de 10 o mas caracteres
    fireEvent.change(textarea, { target: { value: 'Faltante justificado por cambio de turno' } });
    expect(confirmForceBtn).not.toBeDisabled();

    fireEvent.click(confirmForceBtn);

    await waitFor(() => {
      expect(reviewSpy).toHaveBeenLastCalledWith('2026-10-05', expect.objectContaining({
        confirmar: true,
        forzar: true,
        motivo: 'Faltante justificado por cambio de turno'
      }));
    });
    expect(onUpdated).toHaveBeenCalled();
  });

  it('valida montos invalidos en el cliente y permite limpiar valores a null', async () => {
    const reviewSpy = vi.spyOn(cashCloseClient, 'reviewClose').mockResolvedValue({
      ok: true,
      status: 200,
      data: { fecha: '2026-10-05' }
    });

    render(<CashCloseReviewForm cierre={mockCierre} onUpdated={() => {}} />);

    // Monto invalido
    const tarjetaInput = screen.getByLabelText(/Tarjeta neto/i);
    fireEvent.change(tarjetaInput, { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: /^Guardar$/i }));

    expect(screen.getByText(/Monto inválido en tarjeta neto/i)).toBeInTheDocument();
    expect(reviewSpy).not.toHaveBeenCalled();

    // Limpiar valor a vacio (debe enviar null) y modificar observacion
    fireEvent.change(tarjetaInput, { target: { value: '' } });
    const obsInput = screen.getByLabelText(/Observación/i);
    fireEvent.change(obsInput, { target: { value: 'Nueva nota de caja' } });

    fireEvent.click(screen.getByRole('button', { name: /^Guardar$/i }));

    await waitFor(() => {
      expect(reviewSpy).toHaveBeenCalledWith('2026-10-05', {
        tarjeta_neto: null,
        observacion: 'Nueva nota de caja'
      });
    });
  });

  it('muestra errores de campo 422 y error general si la API responde fallo', async () => {
    vi.spyOn(cashCloseClient, 'reviewClose').mockResolvedValue({
      ok: false,
      status: 422,
      data: {
        message: 'Errores de validacion',
        errors: {
          efectivo_contado: ['El monto es incorrecto']
        }
      }
    });

    render(<CashCloseReviewForm cierre={mockCierre} onUpdated={() => {}} />);

    const efectivoInput = screen.getByLabelText(/Efectivo contado/i);
    fireEvent.change(efectivoInput, { target: { value: '500.00' } });

    fireEvent.click(screen.getByRole('button', { name: /^Guardar$/i }));

    await waitFor(() => {
      expect(screen.getByText('El monto es incorrecto')).toBeInTheDocument();
      expect(screen.getByText('Errores de validacion')).toBeInTheDocument();
    });
  });

  it('permite cancelar el modal de fallas y maneja error al forzar el cierre', async () => {
    vi.spyOn(cashCloseClient, 'reviewClose')
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        data: {
          fallas: [{ tipo: 'sin_cierre_runfood', motivo: 'No hay foto' }]
        }
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        data: {
          fallas: [{ tipo: 'sin_cierre_runfood', motivo: 'No hay foto' }]
        }
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        error: 'Fallo al forzar'
      });

    render(<CashCloseReviewForm cierre={mockCierre} onUpdated={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /Guardar y cerrar el día/i }));

    await waitFor(() => {
      expect(screen.getByText('No hay foto')).toBeInTheDocument();
    });

    // Cerrar modal
    fireEvent.click(screen.getByRole('button', { name: /Revisar datos/i }));
    expect(screen.queryByText('No hay foto')).not.toBeInTheDocument();

    // Abrir de nuevo y forzar con fallo
    fireEvent.click(screen.getByRole('button', { name: /Guardar y cerrar el día/i }));
    await waitFor(() => {
      expect(screen.getByText('No hay foto')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Cerrar de todas formas/i }));
    const textarea = screen.getByPlaceholderText(/Explica por qué se fuerza/i);
    fireEvent.change(textarea, { target: { value: 'Motivo de prueba con 10 chars' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Forzar/i }));

    await waitFor(() => {
      expect(screen.getByText('Fallo al forzar')).toBeInTheDocument();
    });
  });

  it('limpia errores de campo al escribir y envia multiples campos modificados', async () => {
    const reviewSpy = vi.spyOn(cashCloseClient, 'reviewClose')
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        data: {
          errors: {
            efectivo_contado: ['Error inicial']
          }
        }
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { fecha: '2026-10-05' }
      });

    render(<CashCloseReviewForm cierre={mockCierre} onUpdated={() => {}} />);

    // Provocar error de campo
    const efectivoInput = screen.getByLabelText(/Efectivo contado/i);
    fireEvent.change(efectivoInput, { target: { value: '99' } });
    fireEvent.click(screen.getByRole('button', { name: /^Guardar$/i }));

    await waitFor(() => {
      expect(screen.getByText('Error inicial')).toBeInTheDocument();
    });

    // Escribir en el campo debe limpiar su error
    fireEvent.change(efectivoInput, { target: { value: '150.00' } });
    expect(screen.queryByText('Error inicial')).not.toBeInTheDocument();

    // Modificar varios otros campos
    fireEvent.change(screen.getByLabelText(/Diners neto/i), { target: { value: '25.00' } });
    fireEvent.change(screen.getByLabelText(/Pedidos Ya neto/i), { target: { value: '30.00' } });
    fireEvent.change(screen.getByLabelText(/Pedidos Ya bruto/i), { target: { value: '35.00' } });
    fireEvent.change(screen.getByLabelText(/Decoración efectivo/i), { target: { value: '5.00' } });
    fireEvent.change(screen.getByLabelText(/Decoración tarjeta/i), { target: { value: '10.00' } });
    fireEvent.change(screen.getByLabelText(/Decoración transf./i), { target: { value: '15.00' } });

    fireEvent.click(screen.getByRole('button', { name: /^Guardar$/i }));

    await waitFor(() => {
      expect(reviewSpy).toHaveBeenLastCalledWith('2026-10-05', expect.objectContaining({
        efectivo_contado: '150.00',
        diners_neto: '25.00',
        pedidos_ya_neto: '30.00',
        pedidos_ya: '35.00',
        decoracion_efectivo: '5.00',
        decoracion_tarjeta: '10.00',
        decoracion_transferencia: '15.00'
      }));
    });
  });

  it('permite cerrar modal con X y alternar vista de forzar con cancelar', async () => {
    vi.spyOn(cashCloseClient, 'reviewClose').mockResolvedValue({
      ok: false,
      status: 422,
      data: {
        message: 'Fallas detectadas',
        fallas: [
          { tipo: 'sin_detalle_ni_motivo' },
          { tipo: 'tipo_con_detalle', detalle: 'Detalle de prueba' }
        ]
      }
    });

    const { container } = render(<CashCloseReviewForm cierre={mockCierre} onUpdated={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /Guardar y cerrar el día/i }));

    await waitFor(() => {
      expect(screen.getByText('sin_detalle_ni_motivo')).toBeInTheDocument();
      expect(screen.getByText('Detalle de prueba')).toBeInTheDocument();
    });

    // Cerrar con boton X
    const closeXBtn = container.querySelector('button svg.lucide-x').closest('button');
    fireEvent.click(closeXBtn);
    expect(screen.queryByText('sin_detalle_ni_motivo')).not.toBeInTheDocument();

    // Reabrir modal
    fireEvent.click(screen.getByRole('button', { name: /Guardar y cerrar el día/i }));
    await waitFor(() => {
      expect(screen.getByText('sin_detalle_ni_motivo')).toBeInTheDocument();
    });

    // Abrir formulario de forzar
    fireEvent.click(screen.getByRole('button', { name: /Cerrar de todas formas/i }));
    expect(screen.getByPlaceholderText(/Explica por qué se fuerza el cierre/i)).toBeInTheDocument();

    // Cancelar formulario de forzar (vuelve a la vista previa del modal)
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(screen.getByRole('button', { name: /Cerrar de todas formas/i })).toBeInTheDocument();
  });
});
