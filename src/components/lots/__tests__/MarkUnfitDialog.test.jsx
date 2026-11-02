import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MarkUnfitDialog from '../MarkUnfitDialog';
import * as lotsClient from '../../../services/lotsClient';

const lot = { id: 12, code: 'L0001', status: 'activo' };

describe('MarkUnfitDialog (Brief 40p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exige dos pasos y un motivo de 5 a 300 caracteres', async () => {
    const spy = vi.spyOn(lotsClient, 'markLotUnfit').mockResolvedValue({ ok: true, data: { data: { ...lot, status: 'no_apto' } } });
    const onDone = vi.fn();
    render(<MarkUnfitDialog isOpen lot={lot} onClose={vi.fn()} onDone={onDone} />);

    expect(screen.getByText(/Todo el saldo saldrá como merma\. No se puede deshacer\./)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    fireEvent.click(screen.getByRole('button', { name: 'Marcar no apto' }));
    expect(await screen.findByText(/Indica el motivo \(5 a 300 caracteres\)/)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Motivo \(5 a 300 caracteres\)/), { target: { value: 'Olor extraño al abrir la funda' } });
    fireEvent.click(screen.getByRole('button', { name: 'Marcar no apto' }));

    await waitFor(() => expect(spy).toHaveBeenCalledWith(12, 'Olor extraño al abrir la funda'));
    expect(onDone).toHaveBeenCalled();
  });
});
