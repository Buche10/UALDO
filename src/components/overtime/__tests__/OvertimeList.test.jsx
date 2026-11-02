import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OvertimeList from '../OvertimeList';
import { ABILITIES } from '../../../services/permissions';
import * as overtimeClient from '../../../services/overtimeClient';

describe('OvertimeList (Brief 36p)', () => {
  const adminUser = {
    id: 1,
    role: 'admin',
    capabilities: {
      role: 'admin',
      abilities: [ABILITIES.OVERTIME_REPORT],
    },
  };

  const kitchenHead = {
    id: 10,
    role: 'kitchen_head',
    capabilities: {
      role: 'kitchen_head',
      area: 'kitchen',
      abilities: [ABILITIES.OVERTIME_REGISTER_KITCHEN],
    },
  };

  const mockEntries = [
    {
      id: 1,
      area: 'kitchen',
      area_label: 'cocina',
      worker: { id: 101, name: 'Marcos Cocinero' },
      work_date: '2026-10-30',
      hours: 2.5,
      note: 'Turno de noche',
      registered_by: { id: 10, name: 'Chef Juan' },
      voided: false,
    },
    {
      id: 2,
      area: 'kitchen',
      area_label: 'cocina',
      worker_name: 'Mateo Refuerzo',
      work_date: '2026-10-29',
      hours: 1.5,
      note: null,
      registered_by: { id: 10, name: 'Chef Juan' },
      voided: true,
      void_reason: 'Marcación errónea de horas',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra la lista de registros con horas y totales', async () => {
    vi.spyOn(overtimeClient, 'listOvertime').mockResolvedValue({
      ok: true,
      data: {
        data: mockEntries,
        meta: { current_page: 1, last_page: 1, total: 2 },
        totals: { total_hours: 4 },
      },
    });

    render(<OvertimeList user={adminUser} />);

    await waitFor(() => {
      expect(screen.getByText('Marcos Cocinero')).toBeInTheDocument();
      expect(screen.getByText('Mateo Refuerzo')).toBeInTheDocument();
    });

    expect(screen.getByText('2.5 h')).toBeInTheDocument();
    expect(screen.getByText('Anulado')).toBeInTheDocument();
    expect(screen.getByText(/Motivo de anulación: Marcación errónea/i)).toBeInTheDocument();
  });

  it('permite anular con motivo obligatorio de mínimo 5 caracteres', async () => {
    vi.spyOn(overtimeClient, 'listOvertime').mockResolvedValue({
      ok: true,
      data: {
        data: [mockEntries[0]],
        meta: { current_page: 1, last_page: 1, total: 1 },
        totals: { total_hours: 2.5 },
      },
    });

    const voidSpy = vi.spyOn(overtimeClient, 'voidOvertime').mockResolvedValue({
      ok: true,
      data: { id: 1, voided: true },
    });

    render(<OvertimeList user={adminUser} />);

    const anularBtn = await screen.findByRole('button', { name: /anular/i });
    fireEvent.click(anularBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const reasonInput = screen.getByPlaceholderText(/explica por qué/i);
    const confirmBtn = screen.getByRole('button', { name: /confirmar anulación/i });

    expect(confirmBtn).toBeDisabled();

    fireEvent.change(reasonInput, { target: { value: 'Registro duplicado por error de conexión' } });
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(voidSpy).toHaveBeenCalledWith(1, 'Registro duplicado por error de conexión');
    });
  });

  it('un jefe de cocina no ve el selector de filtro por área', async () => {
    vi.spyOn(overtimeClient, 'listOvertime').mockResolvedValue({
      ok: true,
      data: { data: [], meta: {} },
    });

    render(<OvertimeList user={kitchenHead} />);

    await waitFor(() => {
      expect(screen.getByText(/no hay registros de horas extra/i)).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/^área$/i)).toBeNull();
  });
});
