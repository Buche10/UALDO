import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewCountModal from '../NewCountModal';

describe('NewCountModal component', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <NewCountModal isOpen={false} onClose={vi.fn()} onCreate={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('submits location and notes, then calls onClose on success', async () => {
    const onCreate = vi.fn().mockResolvedValue({ ok: true, data: { id: 1 } });
    const onClose = vi.fn();

    render(
      <NewCountModal isOpen={true} onClose={onClose} onCreate={onCreate} />
    );

    expect(screen.getByText('Nuevo Conteo Físico')).toBeInTheDocument();

    const select = screen.getByLabelText('Ubicación a contar');
    fireEvent.change(select, { target: { value: 'warehouse' } });

    const notesInput = screen.getByPlaceholderText('Ej: Conteo de reapertura');
    fireEvent.change(notesInput, { target: { value: 'Inicio de semana' } });

    const submitBtn = screen.getByRole('button', { name: /Iniciar Conteo/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith('warehouse', 'Inicio de semana');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('displays error if onCreate fails', async () => {
    const onCreate = vi.fn().mockResolvedValue({
      ok: false,
      error: 'Ubicación con conteo activo',
    });

    render(
      <NewCountModal isOpen={true} onClose={vi.fn()} onCreate={onCreate} />
    );

    const submitBtn = screen.getByRole('button', { name: /Iniciar Conteo/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Ubicación con conteo activo')).toBeInTheDocument();
  });

  it('closes dialog on Escape key press', () => {
    const onClose = vi.fn();
    render(
      <NewCountModal isOpen={true} onClose={onClose} onCreate={vi.fn()} />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
