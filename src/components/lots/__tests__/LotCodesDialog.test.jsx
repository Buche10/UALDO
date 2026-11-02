import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LotCodesDialog from '../LotCodesDialog';

const purchase = {
  id: 22,
  lines: [
    { id: 41, item_name: 'Bife de res', quantity: '10', unit: 'kg' },
    { id: 42, item_name: 'Lomo fino', quantity: '4.5', unit: 'kg' },
  ],
};

describe('LotCodesDialog (Brief 40p)', () => {
  it('muestra cada corte y su código en grande con la instrucción de la funda', () => {
    render(<LotCodesDialog isOpen purchase={purchase} lots={[{ line_id: 41, code: 'L0001' }, { line_id: 42, code: 'L0002' }]} onDone={vi.fn()} />);

    expect(screen.getByText('Escribe este número en cada funda')).toBeInTheDocument();
    expect(screen.getByText('Bife de res')).toBeInTheDocument();
    expect(screen.getByText('L0001')).toBeInTheDocument();
    expect(screen.getByText('L0002')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Listo, ya los anoté' })).toBeInTheDocument();
  });

  it('no se cierra al tocar fuera y solo cierra con el botón', () => {
    const onDone = vi.fn();
    render(<LotCodesDialog isOpen purchase={purchase} lots={[{ line_id: 41, code: 'L0001' }]} onDone={onDone} />);

    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog.parentElement);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Listo, ya los anoté' }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
