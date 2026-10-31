import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SupplyReminderSettings, { validateReminderTime } from '../SupplyReminderSettings';
import ShoppingListPanel from '../ShoppingListPanel';
import * as client from '../../../services/supplyRequestsClient';

describe('SupplyReminderSettings (Brief 28p, punto 31)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('valida formato y hora máxima de 23:45 con validateReminderTime', () => {
    expect(validateReminderTime('')).toContain('obligatoria');
    expect(validateReminderTime('abc')).toContain('Formato');
    expect(validateReminderTime('24:00')).toContain('Formato');
    expect(validateReminderTime('23:46')).toContain('máxima permitida es 23:45');
    expect(validateReminderTime('23:45')).toBeNull();
    expect(validateReminderTime('00:00')).toBeNull();
    expect(validateReminderTime('21:30')).toBeNull();
  });

  it('carga la configuración actual del dueño', async () => {
    vi.spyOn(client, 'getSupplySettings').mockResolvedValueOnce({
      ok: true,
      data: {
        faltantes_reminder_enabled: true,
        faltantes_reminder_time: '20:15',
      },
    });

    render(<SupplyReminderSettings />);
    expect(screen.getByText('Cargando ajuste de aviso...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Aviso de faltantes al personal')).toBeInTheDocument();
    });

    const timeInput = screen.getByLabelText(/Hora del aviso/i);
    expect(timeInput).toHaveValue('20:15');
    expect(screen.getByText('Activado')).toBeInTheDocument();
  });

  it('guarda exitosamente el nuevo horario', async () => {
    vi.spyOn(client, 'getSupplySettings').mockResolvedValueOnce({
      ok: true,
      data: {
        faltantes_reminder_enabled: true,
        faltantes_reminder_time: '21:30',
      },
    });
    const updateSpy = vi.spyOn(client, 'updateSupplySettings').mockResolvedValueOnce({
      ok: true,
      data: {
        faltantes_reminder_enabled: true,
        faltantes_reminder_time: '22:00',
      },
    });

    render(<SupplyReminderSettings />);
    await waitFor(() => expect(screen.getByLabelText(/Hora del aviso/i)).toHaveValue('21:30'));

    const timeInput = screen.getByLabelText(/Hora del aviso/i);
    fireEvent.change(timeInput, { target: { value: '22:00' } });

    fireEvent.click(screen.getByRole('button', { name: 'Guardar horario' }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith({
        faltantes_reminder_enabled: true,
        faltantes_reminder_time: '22:00',
      });
      expect(screen.getByText('Aviso guardado correctamente.')).toBeInTheDocument();
    });
  });

  it('muestra error 422 del motor junto al campo', async () => {
    vi.spyOn(client, 'getSupplySettings').mockResolvedValueOnce({
      ok: true,
      data: {
        faltantes_reminder_enabled: true,
        faltantes_reminder_time: '21:30',
      },
    });
    vi.spyOn(client, 'updateSupplySettings').mockResolvedValueOnce({
      ok: false,
      status: 422,
      data: {
        message: 'La hora máxima permitida para el aviso es 23:45.',
        errors: {
          faltantes_reminder_time: ['La hora máxima permitida para el aviso es 23:45.'],
        },
      },
    });

    render(<SupplyReminderSettings />);
    await waitFor(() => expect(screen.getByLabelText(/Hora del aviso/i)).toHaveValue('21:30'));

    fireEvent.click(screen.getByRole('button', { name: 'Guardar horario' }));

    await waitFor(() => {
      expect(screen.getByText('La hora máxima permitida para el aviso es 23:45.')).toBeInTheDocument();
    });
  });

  it('con el GET fallido no existe el botón "Guardar horario", y "Reintentar" carga el formulario', async () => {
    vi.spyOn(client, 'getSupplySettings')
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        error: 'No se pudieron cargar los ajustes.',
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          faltantes_reminder_enabled: true,
          faltantes_reminder_time: '21:30',
        },
      });

    render(<SupplyReminderSettings />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar los ajustes.');
    });

    expect(screen.queryByRole('button', { name: 'Guardar horario' })).not.toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: 'Reintentar' });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Guardar horario' })).toBeInTheDocument();
      expect(screen.getByLabelText(/Hora del aviso/i)).toHaveValue('21:30');
    });
  });

  it('el personal (no dueño) no ve el ajuste de aviso en Compras', async () => {
    vi.spyOn(client, 'getPurchasingOverview').mockResolvedValueOnce({
      ok: true,
      data: {
        aprobado: [],
        por_aprobar: [],
        bajo_minimo: [],
      },
    });
    const settingsSpy = vi.spyOn(client, 'getSupplySettings');

    render(<ShoppingListPanel isOwner={false} />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando la información de compras...')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Aviso de faltantes al personal')).not.toBeInTheDocument();
    expect(settingsSpy).not.toHaveBeenCalled();
  });
});
