import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WithdrawalCancelModal from '../WithdrawalCancelModal';
import * as withdrawalsClient from '../../../services/withdrawalsClient';
import { ABILITIES } from '../../../services/permissions';

describe('WithdrawalCancelModal (Brief 32p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('permite al autor cancelar directamente dentro de los primeros 15 minutos sin nota', async () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    const cancelSpy = vi.spyOn(withdrawalsClient, 'cancelWithdrawal').mockResolvedValue({
      ok: true,
      data: { id: 10, status: 'cancelled' },
    });

    const withdrawal = {
      id: 10,
      user_id: 15,
      status: 'open',
      created_at: new Date(Date.now() - 5 * 60000).toISOString(), // hace 5 min
    };
    const user = { id: 15, capabilities: { abilities: [] } };

    render(
      <WithdrawalCancelModal
        withdrawal={withdrawal}
        user={user}
        onSuccess={onSuccess}
        onClose={onClose}
      />
    );

    expect(screen.getByText(/Te quedan \d+ min para cancelar directamente/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cancelar retiro/i }));

    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledWith(10, null);
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('no permite cancelar al autor después de 15 minutos', () => {
    const withdrawal = {
      id: 10,
      user_id: 15,
      status: 'open',
      created_at: new Date(Date.now() - 30 * 60000).toISOString(), // hace 30 min
    };
    const user = { id: 15, capabilities: { abilities: [] } };

    render(
      <WithdrawalCancelModal
        withdrawal={withdrawal}
        user={user}
        onSuccess={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Pasaron más de 15 minutos desde que se creó el retiro/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cancelar retiro/i })).not.toBeInTheDocument();
  });

  it('un supervisor tras 15 minutos debe ingresar motivo obligatorio', async () => {
    const cancelSpy = vi.spyOn(withdrawalsClient, 'cancelWithdrawal').mockResolvedValue({
      ok: true,
      data: { id: 10, status: 'cancelled' },
    });

    const withdrawal = {
      id: 10,
      user_id: 15,
      status: 'open',
      created_at: new Date(Date.now() - 30 * 60000).toISOString(), // hace 30 min
    };
    const supervisor = {
      id: 1,
      capabilities: { abilities: [ABILITIES.WITHDRAWALS_SUPERVISE] },
    };

    render(
      <WithdrawalCancelModal
        withdrawal={withdrawal}
        user={supervisor}
        onSuccess={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const noteInput = screen.getByLabelText(/Motivo de cancelación \(obligatorio\)/i);
    fireEvent.change(noteInput, { target: { value: 'Insumo incorrecto' } });

    fireEvent.click(screen.getByRole('button', { name: /Cancelar retiro/i }));

    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledWith(10, 'Insumo incorrecto');
    });
  });
});
