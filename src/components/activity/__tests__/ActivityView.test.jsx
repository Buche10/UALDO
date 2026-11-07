import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ActivityView from '../ActivityView';
import * as activityClient from '../../../services/activityClient';
import { getTodayDateString } from '../../../services/overtimeClient';

describe('ActivityView (Brief 46p)', () => {
  const today = getTodayDateString();
  const mockActivities = [
    {
      id: 1,
      fecha: `${today}T12:00:00Z`,
      modulo: 'inventario',
      modulo_label: 'Inventario',
      descripcion: 'Sacó 2 kg de Lomo fino de Cocina.',
      persona: { id: 10, nombre: 'Chef Juan', cargo_label: 'Jefe de cocina' },
      referencia: null,
    },
    {
      id: 2,
      fecha: '2026-11-01T09:00:00Z',
      modulo: 'horas_extra',
      modulo_label: 'Horas extra',
      descripcion: 'Aprobó 2 h de horas extra para Carlos Cocinero.',
      persona: { id: 1, nombre: 'Ana Dueña', cargo_label: 'Dueño' },
      referencia: null,
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(activityClient, 'listActivityPeople').mockResolvedValue({
      ok: true,
      data: [
        { id: 1, nombre: 'Ana Dueña', cargo_label: 'Dueño' },
        { id: 10, nombre: 'Chef Juan', cargo_label: 'Jefe de cocina' },
      ],
    });
    vi.spyOn(activityClient, 'listActivity').mockResolvedValue({
      ok: true,
      data: {
        data: mockActivities,
        meta: { current_page: 1, last_page: 2, total: 4 },
      },
    });
  });

  it('pinta filas agrupadas por día y cabecera de hoy', async () => {
    render(<ActivityView />);

    await waitFor(() => {
      expect(screen.getByText('Sacó 2 kg de Lomo fino de Cocina.')).toBeInTheDocument();
    });

    expect(screen.getByText('Hoy')).toBeInTheDocument();
    expect(screen.getByText('2026-11-01')).toBeInTheDocument();
    expect(screen.getByText('Aprobó 2 h de horas extra para Carlos Cocinero.')).toBeInTheDocument();
  });

  it('aplicar el filtro de módulo llama a listActivity con modulo', async () => {
    const listSpy = vi.spyOn(activityClient, 'listActivity').mockResolvedValue({
      ok: true,
      data: {
        data: [mockActivities[0]],
        meta: { current_page: 1, last_page: 1, total: 1 },
      },
    });

    render(<ActivityView />);

    await waitFor(() => {
      expect(screen.getByText('Sacó 2 kg de Lomo fino de Cocina.')).toBeInTheDocument();
    });

    const moduloSelect = screen.getByLabelText(/módulo/i);
    fireEvent.change(moduloSelect, { target: { value: 'inventario' } });

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          modulo: 'inventario',
        })
      );
    });
  });

  it('"Ver más" pide la página 2', async () => {
    const listSpy = vi.spyOn(activityClient, 'listActivity').mockResolvedValue({
      ok: true,
      data: {
        data: mockActivities,
        meta: { current_page: 1, last_page: 2, total: 4 },
      },
    });

    render(<ActivityView />);

    const verMasBtn = await screen.findByRole('button', { name: /ver más/i });
    expect(verMasBtn).toBeInTheDocument();

    fireEvent.click(verMasBtn);

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });

  it('muestra estado vacío cuando no hay registros', async () => {
    vi.spyOn(activityClient, 'listActivity').mockResolvedValue({
      ok: true,
      data: {
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0 },
      },
    });

    render(<ActivityView />);

    expect(await screen.findByText('No hay cambios en estas fechas.')).toBeInTheDocument();
  });

  it('muestra estado de error y botón "Reintentar"', async () => {
    vi.spyOn(activityClient, 'listActivity').mockResolvedValue({
      ok: false,
      error: 'Error de conexión con el motor.',
    });

    render(<ActivityView />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Error de conexión con el motor.');
    const retryBtn = screen.getByRole('button', { name: /reintentar/i });
    expect(retryBtn).toBeInTheDocument();
  });
});
