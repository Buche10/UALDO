import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TemporaryPasswordDialog from '../TemporaryPasswordDialog';

const originalClipboard = navigator.clipboard;

describe('TemporaryPasswordDialog (Brief 45p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
  });

  it('muestra la contraseña temporal y el texto de entrega', () => {
    render(
      <TemporaryPasswordDialog
        name="María Salón"
        email="maria@doblefilo.ualdocorp.com"
        password="Temp12345"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Temp12345')).toBeInTheDocument();
    expect(screen.getByText('María Salón · maria@doblefilo.ualdocorp.com')).toBeInTheDocument();
    expect(screen.getByText('Entrégala en persona. No se vuelve a mostrar. Al entrar por primera vez tendrá que cambiarla.')).toBeInTheDocument();
  });

  it('copia la contraseña con la Clipboard API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<TemporaryPasswordDialog name="María" email="maria@rest.com" password="Temp12345" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('Temp12345');
    });
    expect(screen.getByText('Copiada')).toBeInTheDocument();
  });

  it('avisa cuando no se puede copiar', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Bloqueado'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<TemporaryPasswordDialog name="María" email="maria@rest.com" password="Temp12345" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }));

    expect(await screen.findByText('No se pudo copiar. Anótala antes de cerrar.')).toBeInTheDocument();
  });

  it('cierra el diálogo con el botón Cerrar', () => {
    const onClose = vi.fn();
    render(<TemporaryPasswordDialog name="María" email="maria@rest.com" password="Temp12345" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
