import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EscalateDailyCloseDialog from '../EscalateDailyCloseDialog';
import * as countsClient from '../../../../services/inventoryCountsClient';

describe('EscalateDailyCloseDialog component (Brief 31p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <EscalateDailyCloseDialog isOpen={false} countId={10} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('permite ingresar nota y confirma escalamiento exitoso', async () => {
    const escalateSpy = vi.spyOn(countsClient, 'escalateCount').mockResolvedValue({
      ok: true,
      data: { data: { id: 10, status: 'escalated' } },
    });
    const onClose = vi.fn();
    const onEscalated = vi.fn();

    render(
      <EscalateDailyCloseDialog
        isOpen={true}
        countId={10}
        onClose={onClose}
        onEscalated={onEscalated}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Confirmar escalamiento/i });
    expect(submitBtn).toBeDisabled();

    const textarea = screen.getByRole('textbox', { name: /Motivo del escalamiento/i });
    fireEvent.change(textarea, { target: { value: 'Diferencia inexplicable en bife' } });

    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(escalateSpy).toHaveBeenCalledWith(10, 'Diferencia inexplicable en bife');
      expect(onClose).toHaveBeenCalled();
      expect(onEscalated).toHaveBeenCalled();
    });
  });

  it('muestra mensaje de error cuando falla el servicio', async () => {
    vi.spyOn(countsClient, 'escalateCount').mockResolvedValue({
      ok: false,
      error: 'Error de prueba al escalar',
    });

    render(
      <EscalateDailyCloseDialog
        isOpen={true}
        countId={10}
        onClose={vi.fn()}
      />
    );

    const textarea = screen.getByRole('textbox', { name: /Motivo del escalamiento/i });
    fireEvent.change(textarea, { target: { value: 'Nota de prueba' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar escalamiento/i }));

    expect(await screen.findByText('Error de prueba al escalar')).toBeInTheDocument();
  });

  it('se cierra con Escape o con botón Cancelar', () => {
    const onClose = vi.fn();
    render(
      <EscalateDailyCloseDialog
        isOpen={true}
        countId={10}
        onClose={onClose}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
