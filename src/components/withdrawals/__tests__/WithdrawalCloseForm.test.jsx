import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WithdrawalCloseForm from '../WithdrawalCloseForm';
import * as withdrawalsClient from '../../../services/withdrawalsClient';

describe('WithdrawalCloseForm (Brief 32p)', () => {
  const dummyWithdrawal = {
    id: 42,
    user_id: 10,
    to_location: 'kitchen',
    purpose: 'Pastelería',
    lines: [
      { id: 101, line_id: 101, item_name: 'Harina', quantity: '5.000', unit: 'kg' },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calcula en vivo lo que queda en el área y bloquea si la suma supera lo retirado', async () => {
    render(
      <WithdrawalCloseForm
        withdrawal={dummyWithdrawal}
        user={{ id: 10 }}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const consumedInput = screen.getByLabelText(/Usé \(kg\)/i);
    const returnedInput = screen.getByLabelText(/Devolví \(kg\)/i);

    // 3 usé, 1 devolví -> queda 1
    fireEvent.change(consumedInput, { target: { value: '3' } });
    fireEvent.change(returnedInput, { target: { value: '1' } });

    expect(screen.getByText('Queda en Cocina: 1 kg')).toBeInTheDocument();

    // 4 usé, 2 devolví -> supera 5
    fireEvent.change(consumedInput, { target: { value: '4' } });
    fireEvent.change(returnedInput, { target: { value: '2' } });

    expect(
      screen.getByText('La suma de usado y devuelto supera lo retirado.')
    ).toBeInTheDocument();

    // El botón debe estar deshabilitado
    const submitBtn = screen.getByRole('button', { name: /Confirmar cierre/i });
    expect(submitBtn).toBeDisabled();
  });

  it('exige nota obligatoria si queda insumo en el área', async () => {
    render(
      <WithdrawalCloseForm
        withdrawal={dummyWithdrawal}
        user={{ id: 10 }}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Quedan 2 kg en cocina (usé 3, devolví 0)
    fireEvent.change(screen.getByLabelText(/Usé \(kg\)/i), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/Devolví \(kg\)/i), { target: { value: '0' } });

    // Intenta enviar sin nota
    fireEvent.click(screen.getByRole('button', { name: /Confirmar cierre/i }));

    expect(
      await screen.findByText(/Quedó insumo en el área. La nota es obligatoria/i)
    ).toBeInTheDocument();
  });

  it('exige nota obligatoria si un supervisor cierra el retiro de otro trabajador', async () => {
    // dummyWithdrawal tiene user_id: 10, supervisor actual tiene id: 99
    render(
      <WithdrawalCloseForm
        withdrawal={dummyWithdrawal}
        user={{ id: 99 }}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Usó todo (5 kg), devuelto 0 -> queda 0, pero es supervisor cerrando a otro
    fireEvent.change(screen.getByLabelText(/Usé \(kg\)/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Devolví \(kg\)/i), { target: { value: '0' } });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar cierre/i }));

    expect(
      await screen.findByText(/Debes ingresar una nota explicando el cierre en nombre del trabajador/i)
    ).toBeInTheDocument();
  });

  it('cierra exitosamente cuando todo es válido', async () => {
    const onSuccess = vi.fn();
    const closeSpy = vi.spyOn(withdrawalsClient, 'closeWithdrawal').mockResolvedValue({
      ok: true,
      data: { id: 42, status: 'closed' },
    });

    render(
      <WithdrawalCloseForm
        withdrawal={dummyWithdrawal}
        user={{ id: 10 }}
        onSuccess={onSuccess}
        onCancel={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/Usé \(kg\)/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Devolví \(kg\)/i), { target: { value: '0' } });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar cierre/i }));

    await waitFor(() => {
      expect(closeSpy).toHaveBeenCalledWith(
        42,
        [{ line_id: 101, consumed: '5', returned: '0' }],
        null
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
