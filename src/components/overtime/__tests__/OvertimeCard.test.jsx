import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OvertimeCard from '../OvertimeCard';

describe('OvertimeCard (Brief 46p)', () => {
  const baseEntry = {
    id: 1,
    area: 'kitchen',
    area_label: 'Cocina',
    worker: { id: 10, name: 'Carlos Cocinero' },
    work_date: '2026-11-06',
    hours: 2,
    note: 'Turno extra',
    status: 'pending',
  };

  it('muestra distintivo "Pendiente" con variables de color de aviso', () => {
    render(<OvertimeCard entry={baseEntry} />);
    const badge = screen.getByText('Pendiente');
    expect(badge).toBeInTheDocument();
  });

  it('muestra distintivo "Aprobada" y quién decidió si fue decidida', () => {
    const approvedEntry = {
      ...baseEntry,
      status: 'approved',
      decided_by: { id: 1, name: 'Pedro Dueño' },
      decided_at: '2026-11-06T18:00:00Z',
    };
    render(<OvertimeCard entry={approvedEntry} />);
    expect(screen.getByText('Aprobada')).toBeInTheDocument();
    expect(screen.getByText(/Decidió Pedro Dueño el 2026-11-06/i)).toBeInTheDocument();
  });

  it('muestra distintivo "Rechazada", motivo de rechazo y quién decidió', () => {
    const rejectedEntry = {
      ...baseEntry,
      status: 'rejected',
      decision_note: 'No correspondía turno extra en ese horario',
      decided_by: { id: 1, name: 'Pedro Dueño' },
      decided_at: '2026-11-06T18:30:00Z',
    };
    render(<OvertimeCard entry={rejectedEntry} />);
    expect(screen.getByText('Rechazada')).toBeInTheDocument();
    expect(screen.getByText(/Motivo de rechazo: No correspondía turno extra/i)).toBeInTheDocument();
    expect(screen.getByText(/Decidió Pedro Dueño el 2026-11-06/i)).toBeInTheDocument();
  });

  it('con canApprove=true y estado pendiente muestra botones Aprobar y Rechazar', () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    render(
      <OvertimeCard
        entry={baseEntry}
        canApprove={true}
        onApproveClick={onApprove}
        onRejectClick={onReject}
      />
    );

    const approveBtn = screen.getByRole('button', { name: /aprobar/i });
    const rejectBtn = screen.getByRole('button', { name: /rechazar/i });
    expect(approveBtn).toBeInTheDocument();
    expect(rejectBtn).toBeInTheDocument();

    fireEvent.click(approveBtn);
    expect(onApprove).toHaveBeenCalledWith(baseEntry);

    fireEvent.click(rejectBtn);
    expect(onReject).toHaveBeenCalledWith(baseEntry);
  });

  it('sin canApprove no muestra botones de aprobación ni rechazo', () => {
    render(<OvertimeCard entry={baseEntry} canApprove={false} />);
    expect(screen.queryByRole('button', { name: /aprobar/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /rechazar/i })).toBeNull();
  });
});
