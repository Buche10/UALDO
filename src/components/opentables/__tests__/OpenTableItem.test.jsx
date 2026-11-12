import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import OpenTableItem from '../OpenTableItem';

const baseMesa = {
  pedido_id: 123456,
  mesa: '4',
  grupo: 'SALON',
  etiqueta: 'Mesa 4 (SALON)',
  pax: 4,
  mesero: 'Juan',
  abierta_desde: '2026-11-09T20:05:00-05:00',
  minutos_abierta: 95,
  de_dia_anterior: false,
  precuenta: false,
};

describe('OpenTableItem (Brief 47p)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-09T22:00:00-05:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra etiqueta, hora de apertura, duración recalculada, mesero y comensales', () => {
    render(<OpenTableItem mesa={baseMesa} />);

    expect(screen.getByText('Mesa 4 (SALON)')).toBeInTheDocument();
    expect(screen.getByText('Desde 20:05 (1 h 55 min)')).toBeInTheDocument();
    expect(screen.getByText('Juan')).toBeInTheDocument();
    expect(screen.getByText('4 comensales')).toBeInTheDocument();
    expect(screen.queryByText('Precuenta')).not.toBeInTheDocument();
    expect(screen.queryByText(/Por cobrar/)).not.toBeInTheDocument();
  });

  it('marca la precuenta y pinta el pendiente cuando llega', () => {
    render(<OpenTableItem mesa={{ ...baseMesa, precuenta: true, pendiente: '45.60' }} />);

    expect(screen.getByText('Precuenta')).toBeInTheDocument();
    expect(screen.getByText('Por cobrar USD 45,60')).toBeInTheDocument();
  });

  it('muestra el cobro parcial cuando facturado es mayor que cero', () => {
    render(<OpenTableItem mesa={{ ...baseMesa, facturado: '10.00', pendiente: '35.60' }} />);

    expect(screen.getByText('Cobrado en parte: USD 10,00')).toBeInTheDocument();
    expect(screen.getByText('Por cobrar USD 35,60')).toBeInTheDocument();
  });

  it('no muestra cobro parcial cuando facturado es cero', () => {
    render(<OpenTableItem mesa={{ ...baseMesa, facturado: '0.00' }} />);

    expect(screen.queryByText(/Cobrado en parte/)).not.toBeInTheDocument();
  });

  it('muestra "De ayer" cuando la mesa viene de un día anterior', () => {
    render(
      <OpenTableItem mesa={{ ...baseMesa, de_dia_anterior: true, abierta_desde: '2026-11-08T20:00:00-05:00' }} />
    );

    expect(screen.getByText('De ayer')).toBeInTheDocument();
  });

  it('muestra la fecha del día de apertura cuando es más antigua que ayer', () => {
    render(
      <OpenTableItem mesa={{ ...baseMesa, de_dia_anterior: true, abierta_desde: '2026-11-07T20:00:00-05:00' }} />
    );

    expect(screen.getByText(/Desde el 7/)).toBeInTheDocument();
  });

  it('resalta con color de aviso una mesa abierta más de 3 horas', () => {
    render(<OpenTableItem mesa={{ ...baseMesa, abierta_desde: '2026-11-09T18:00:00-05:00' }} />);

    const row = screen.getByRole('listitem');
    expect(row.style.background).toBe('var(--warning-soft)');
    expect(row.style.border).toContain('var(--border-warning)');
    expect(screen.getByText('Desde 18:00 (4 h)')).toBeInTheDocument();
  });

  it('no resalta una mesa abierta menos de 3 horas', () => {
    render(<OpenTableItem mesa={baseMesa} />);

    const row = screen.getByRole('listitem');
    expect(row.style.background).toBe('var(--card-subtle-bg)');
  });

  it('no pinta montos cuando el motor no los envía', () => {
    render(<OpenTableItem mesa={{ ...baseMesa, precuenta: true }} />);

    expect(screen.queryByText(/USD/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Por cobrar/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Cobrado en parte/)).not.toBeInTheDocument();
  });

  it('tolera una mesa sin fecha de apertura legible', () => {
    render(<OpenTableItem mesa={{ ...baseMesa, abierta_desde: null }} />);

    expect(screen.queryByText(/^Desde/)).not.toBeInTheDocument();
    expect(screen.getByText('Mesa 4 (SALON)')).toBeInTheDocument();
  });
});
