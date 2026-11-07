import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OvertimeSummary from '../OvertimeSummary';
import * as overtimeClient from '../../../services/overtimeClient';

describe('OvertimeSummary (Brief 36p y Brief 46p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockSummary = {
    month: '2026-10',
    total_hours: 12.5,
    people: 2,
    pending_count: 3,
    pending_hours: 5.5,
    workers: [
      {
        worker_user_id: 12,
        worker_name: 'Danny Cocinero',
        hours: 8.0,
        days_count: 2,
        days: [
          { date: '2026-10-29', hours: 4.0 },
          { date: '2026-10-30', hours: 4.0 },
        ],
      },
      {
        worker_user_id: null,
        worker_name: 'Lucía Extra',
        hours: 4.5,
        days_count: 1,
        days: [{ date: '2026-10-31', hours: 4.5 }],
      },
    ],
  };

  it('muestra el resumen del mes con horas totales y colaboradores', async () => {
    vi.spyOn(overtimeClient, 'getOvertimeSummary').mockResolvedValue({
      ok: true,
      data: mockSummary,
    });

    render(<OvertimeSummary initialMonth="2026-10" />);

    await waitFor(() => {
      expect(screen.getByText('Danny Cocinero')).toBeInTheDocument();
      expect(screen.getByText('Lucía Extra')).toBeInTheDocument();
    });

    expect(screen.getByText('12.5 h')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('muestra "Pendientes de aprobar: {n} registros, {h} h" si pending_count > 0', async () => {
    vi.spyOn(overtimeClient, 'getOvertimeSummary').mockResolvedValue({
      ok: true,
      data: mockSummary,
    });

    render(<OvertimeSummary initialMonth="2026-10" />);

    expect(await screen.findByText('Pendientes de aprobar: 3 registros, 5.5 h')).toBeInTheDocument();
  });

  it('al pulsar la tarjeta del trabajador se abre el desglose por día', async () => {
    vi.spyOn(overtimeClient, 'getOvertimeSummary').mockResolvedValue({
      ok: true,
      data: mockSummary,
    });

    render(<OvertimeSummary initialMonth="2026-10" />);

    const workerBtn = await screen.findByRole('button', { name: /danny cocinero/i });
    expect(screen.queryByText('2026-10-29')).toBeNull();

    fireEvent.click(workerBtn);

    expect(screen.getByText('2026-10-29')).toBeInTheDocument();
    expect(screen.getByText('2026-10-30')).toBeInTheDocument();
  });
});
