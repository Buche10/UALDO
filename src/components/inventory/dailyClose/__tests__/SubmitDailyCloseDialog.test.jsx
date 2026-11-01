import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SubmitDailyCloseDialog from '../SubmitDailyCloseDialog';
import * as countsClient from '../../../../services/inventoryCountsClient';

describe('SubmitDailyCloseDialog component (Brief 31p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra confirmación de dos pasos y envía el conteo', async () => {
    const savePendingMock = vi.fn().mockResolvedValue(true);
    const submitSpy = vi.spyOn(countsClient, 'submitCount').mockResolvedValue({
      ok: true,
      data: { data: { id: 10, status: 'submitted' } },
    });
    const successMock = vi.fn();
    const closeMock = vi.fn();

    render(
      <SubmitDailyCloseDialog
        isOpen={true}
        countId={10}
        savePendingLines={savePendingMock}
        onClose={closeMock}
        onSubmitSuccess={successMock}
      />
    );

    expect(screen.getByText('Enviar conteo del día')).toBeInTheDocument();
    expect(screen.getByText('Se calcularán las diferencias con el sistema.')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirmar envío/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(savePendingMock).toHaveBeenCalled();
      expect(submitSpy).toHaveBeenCalledWith(10);
      expect(successMock).toHaveBeenCalled();
      expect(closeMock).toHaveBeenCalled();
    });
  });

  it('el 409 de ventas muestra el mensaje y el botón Reintentar', async () => {
    const savePendingMock = vi.fn().mockResolvedValue(true);
    const submitSpy = vi.spyOn(countsClient, 'submitCount').mockResolvedValue({
      ok: false,
      status: 409,
      code: countsClient.SALES_PENDING_CODE,
      error: 'Falta descontar las ventas del día. Intenta de nuevo en unos minutos.',
    });

    render(
      <SubmitDailyCloseDialog
        isOpen={true}
        countId={10}
        savePendingLines={savePendingMock}
        onClose={vi.fn()}
        onSubmitSuccess={vi.fn()}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Confirmar envío/i });
    fireEvent.click(confirmBtn);

    expect(
      await screen.findByText('Falta descontar las ventas del día. Intenta de nuevo en unos minutos.')
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Reintentar/i });
    expect(retryBtn).toBeInTheDocument();

    // Al hacer clic en reintentar, vuelve a intentar
    submitSpy.mockResolvedValueOnce({
      ok: true,
      data: { data: { id: 10, status: 'validated' } },
    });

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(2);
    });
  });
});
