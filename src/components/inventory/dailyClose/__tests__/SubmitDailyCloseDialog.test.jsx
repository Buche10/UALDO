import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SubmitDailyCloseDialog from '../SubmitDailyCloseDialog';
import * as countsClient from '../../../../services/inventoryCountsClient';

describe('SubmitDailyCloseDialog component (Brief 31p / 31p_fix)', () => {
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

    submitSpy.mockResolvedValueOnce({
      ok: true,
      data: { data: { id: 10, status: 'validated' } },
    });

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('el 409 de RunFood pendiente muestra el mensaje y NO muestra Reintentar (Requerimiento 6)', async () => {
    const savePendingMock = vi.fn().mockResolvedValue(true);
    vi.spyOn(countsClient, 'submitCount').mockResolvedValue({
      ok: false,
      status: 409,
      code: countsClient.RUNFOOD_PENDING_CODE,
      error: 'RunFood todavía no envió las ventas del día. El cierre se podrá enviar cuando lleguen.',
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
      await screen.findByText('RunFood todavía no envió las ventas del día. El cierre se podrá enviar cuando lleguen.')
    ).toBeInTheDocument();

    // NO debe mostrar el botón de reintentar
    expect(screen.queryByRole('button', { name: /Reintentar/i })).toBeNull();
    // Mantiene visible el botón de Confirmar envío
    expect(screen.getByRole('button', { name: /Confirmar envío/i })).toBeInTheDocument();
  });

  it('avisa error si falla el guardado de cambios pendientes', async () => {
    const savePendingMock = vi.fn().mockResolvedValue(false);
    render(
      <SubmitDailyCloseDialog
        isOpen={true}
        countId={10}
        savePendingLines={savePendingMock}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Confirmar envío/i }));
    expect(
      await screen.findByText('No se pudieron guardar los últimos cambios del conteo.')
    ).toBeInTheDocument();
  });

  it('se cierra con tecla Escape o botón Cancelar', () => {
    const onCloseMock = vi.fn();
    render(
      <SubmitDailyCloseDialog
        isOpen={true}
        countId={10}
        onClose={onCloseMock}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(onCloseMock).toHaveBeenCalledTimes(2);
  });
});
