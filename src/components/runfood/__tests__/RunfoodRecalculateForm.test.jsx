import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RunfoodRecalculateForm from '../RunfoodRecalculateForm';

describe('RunfoodRecalculateForm', () => {
  it('valida localmente que la fecha inicial no sea posterior a la final', () => {
    const onRecalculate = vi.fn();
    render(<RunfoodRecalculateForm onRecalculate={onRecalculate} />);

    const desdeInput = screen.getByLabelText('Fecha inicial de recálculo');
    const hastaInput = screen.getByLabelText('Fecha final de recálculo');

    fireEvent.change(desdeInput, { target: { value: '2026-10-20' } });
    fireEvent.change(hastaInput, { target: { value: '2026-10-10' } });

    fireEvent.click(screen.getByRole('button', { name: 'Recalcular período' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/no puede ser posterior/i);
    expect(onRecalculate).not.toHaveBeenCalled();
  });

  it('valida localmente rango maximo de 31 dias', () => {
    const onRecalculate = vi.fn();
    render(<RunfoodRecalculateForm onRecalculate={onRecalculate} />);

    const desdeInput = screen.getByLabelText('Fecha inicial de recálculo');
    const hastaInput = screen.getByLabelText('Fecha final de recálculo');

    fireEvent.change(desdeInput, { target: { value: '2026-09-01' } });
    fireEvent.change(hastaInput, { target: { value: '2026-10-15' } }); // 45 dias

    fireEvent.click(screen.getByRole('button', { name: 'Recalcular período' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/m[aá]ximo permitido para recalcular es de 31 d[ií]as/i);
    expect(onRecalculate).not.toHaveBeenCalled();
  });

  it('requiere dos pasos para confirmar el recalculo', async () => {
    const onRecalculate = vi.fn().mockResolvedValue({ ok: true });
    render(<RunfoodRecalculateForm onRecalculate={onRecalculate} />);

    const desdeInput = screen.getByLabelText('Fecha inicial de recálculo');
    const hastaInput = screen.getByLabelText('Fecha final de recálculo');

    fireEvent.change(desdeInput, { target: { value: '2026-10-01' } });
    fireEvent.change(hastaInput, { target: { value: '2026-10-10' } });

    // Paso 1
    fireEvent.click(screen.getByRole('button', { name: 'Recalcular período' }));

    expect(screen.getByText(/solicitar el recálculo de consumo entre el 2026-10-01 y el 2026-10-10/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar recálculo' })).toBeInTheDocument();
    expect(onRecalculate).not.toHaveBeenCalled();

    // Paso 2
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar recálculo' }));

    await waitFor(() => {
      expect(onRecalculate).toHaveBeenCalledWith({
        desde: '2026-10-01',
        hasta: '2026-10-10'
      });
    });
  });

  it('muestra mensaje de exito con dias encolados', () => {
    const onClear = vi.fn();
    render(
      <RunfoodRecalculateForm
        result={{ status: 'queued', dias_encolados: 8 }}
        onRecalculate={vi.fn()}
        onClearResult={onClear}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent(/Se encolaron 8 días para recálculo/i);
    expect(screen.getByRole('status')).toHaveTextContent(/aparecerá en unos minutos/i);

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
