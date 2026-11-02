import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportIncidentSheet from '../ReportIncidentSheet';
import * as incidentsClient from '../../../services/incidentsClient';

describe('ReportIncidentSheet (Brief 37p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockUser = {
    id: 10,
    role: 'kitchen_staff',
    capabilities: { area: 'kitchen' },
  };

  it('inicia en paso 1 con tres botones de tipo y pasa al paso 2 al seleccionar', () => {
    render(<ReportIncidentSheet user={mockUser} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Algo se dañó')).toBeInTheDocument();
    expect(screen.getByText('Se rompió algo')).toBeInTheDocument();
    expect(screen.getByText('Queja de un cliente')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Algo se dañó'));

    expect(screen.getByLabelText(/severidad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/relato de lo sucedido/i)).toBeInTheDocument();
  });

  it('en rotura pide qué se rompió y cantidad', () => {
    render(<ReportIncidentSheet user={mockUser} isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Se rompió algo'));

    expect(screen.getByLabelText(/qué se rompió/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cantidad de piezas/i)).toBeInTheDocument();
  });

  it('en queja muestra aviso fijo de no anotar datos personales del cliente', () => {
    render(<ReportIncidentSheet user={mockUser} isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Queja de un cliente'));

    expect(screen.getByText(/aviso: no anotes nombres ni teléfonos del cliente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/plato observado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/clase de queja/i)).toBeInTheDocument();
  });

  it('la foto es opcional y permite registrar sin ella', async () => {
    const createSpy = vi.spyOn(incidentsClient, 'createIncident').mockResolvedValue({
      ok: true,
      data: { id: 25 },
    });
    const onCreated = vi.fn();
    const onClose = vi.fn();

    render(<ReportIncidentSheet user={mockUser} isOpen={true} onClose={onClose} onCreated={onCreated} />);
    fireEvent.click(screen.getByText('Algo se dañó'));

    fireEvent.change(screen.getByLabelText(/relato/i), {
      target: { value: 'La freidora no calienta el aceite.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar reporte/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'averia',
          description: 'La freidora no calienta el aceite.',
          area: 'kitchen',
        })
      );
      expect(onCreated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('el 422 por datos personales se muestra junto al relato', async () => {
    vi.spyOn(incidentsClient, 'createIncident').mockResolvedValue({
      ok: false,
      status: 422,
      error: 'No registres datos personales del cliente.',
    });

    render(<ReportIncidentSheet user={mockUser} isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Queja de un cliente'));

    fireEvent.change(screen.getByLabelText(/plato/i), { target: { value: 'Lomo fino' } });
    fireEvent.change(screen.getByLabelText(/relato/i), {
      target: { value: 'El señor Juan Pérez teléfono 0991234567 se quejó.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar reporte/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/no registres datos personales/i);
    });
  });
});
