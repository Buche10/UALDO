import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RunfoodConsumptionSettingsCard from '../RunfoodConsumptionSettingsCard';

describe('RunfoodConsumptionSettingsCard', () => {
  it('muestra estado apagado cuando enabled es false', () => {
    const settings = { enabled: false, start_date: null, location: 'kitchen' };
    render(<RunfoodConsumptionSettingsCard settings={settings} onSave={vi.fn()} />);

    expect(screen.getByText('Apagado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activar consumo' })).toBeDisabled();
  });

  it('el boton activar queda deshabilitado sin la casilla obligatoria de reapertura', () => {
    const settings = { enabled: false, start_date: null, location: 'kitchen' };
    render(<RunfoodConsumptionSettingsCard settings={settings} onSave={vi.fn()} />);

    const activateBtn = screen.getByRole('button', { name: 'Activar consumo' });
    expect(activateBtn).toBeDisabled();

    // Marcar la casilla
    const checkboxBtn = screen.getByText('Ya cargué el stock real con el conteo de reapertura');
    fireEvent.click(checkboxBtn);

    expect(activateBtn).not.toBeDisabled();
  });

  it('requiere dos pasos para activar con mensaje explicativo', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    const settings = { enabled: false, start_date: '2026-10-15', location: 'kitchen' };
    render(<RunfoodConsumptionSettingsCard settings={settings} onSave={onSave} />);

    // Marcar casilla
    fireEvent.click(screen.getByText('Ya cargué el stock real con el conteo de reapertura'));

    // Paso 1: clic en Activar consumo
    fireEvent.click(screen.getByRole('button', { name: 'Activar consumo' }));

    // Ver explicacion del paso 2
    expect(screen.getByText(/descontará del inventario de Cocina lo vendido/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar activación' })).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    // Paso 2: confirmar
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar activación' }));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        enabled: true,
        start_date: '2026-10-15',
        location: 'kitchen'
      });
    });
  });

  it('muestra estado activo y requiere dos pasos para desactivar', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    const settings = { enabled: true, start_date: '2026-10-01', location: 'warehouse' };
    render(<RunfoodConsumptionSettingsCard settings={settings} onSave={onSave} />);

    expect(screen.getByText('Activo desde 2026-10-01 en Bodega')).toBeInTheDocument();

    // Paso 1: clic en Desactivar
    fireEvent.click(screen.getByRole('button', { name: /desactivar consumo/i }));

    expect(screen.getByText(/desactivar el consumo automático/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar desactivación' })).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    // Paso 2: confirmar
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar desactivación' }));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        enabled: false,
        location: 'warehouse'
      });
    });
  });

  it('muestra mensaje de error del motor en alerta', () => {
    const settings = { enabled: false, start_date: null, location: 'kitchen' };
    render(<RunfoodConsumptionSettingsCard settings={settings} error="Fecha de inicio fuera de rango" onSave={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Fecha de inicio fuera de rango');
  });
});
