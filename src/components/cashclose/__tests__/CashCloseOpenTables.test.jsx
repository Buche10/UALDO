import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CashCloseOpenTables from '../CashCloseOpenTables';

const detalle = [
  {
    etiqueta: 'Mesa 4 (SALON)',
    mesero: 'Juan',
    abierta_desde: '2026-11-09T20:05:00-05:00',
    pendiente: '45.60',
    precuenta: true,
  },
];

describe('CashCloseOpenTables (Brief 47p)', () => {
  it('muestra las mesas evaluadas con su monto y precuenta', () => {
    render(
      <CashCloseOpenTables
        bloque={{ estado: 'evaluado', mesas: 1, pendiente: '45.60', detalle }}
      />
    );

    expect(screen.getByText('Mesas abiertas al cierre')).toBeInTheDocument();
    expect(screen.getByText('1 mesa sin cobrar en RunFood por USD 45,60.')).toBeInTheDocument();
    expect(screen.getByText('Mesa 4 (SALON)')).toBeInTheDocument();
    expect(screen.getByText('Juan')).toBeInTheDocument();
    expect(screen.getByText('Desde 20:05')).toBeInTheDocument();
    expect(screen.getByText('Por cobrar USD 45,60')).toBeInTheDocument();
    expect(screen.getByText('Precuenta')).toBeInTheDocument();
  });

  it('resume en plural cuando hay varias mesas', () => {
    render(
      <CashCloseOpenTables
        bloque={{ estado: 'evaluado', mesas: 2, pendiente: '83.10', detalle }}
      />
    );

    expect(screen.getByText('2 mesas sin cobrar en RunFood por USD 83,10.')).toBeInTheDocument();
  });

  it('evaluado sin mesas muestra la linea discreta', () => {
    render(<CashCloseOpenTables bloque={{ estado: 'evaluado', mesas: 0, pendiente: '0.00', detalle: [] }} />);

    expect(screen.getByText('Sin mesas abiertas al cierre.')).toBeInTheDocument();
    expect(screen.queryByText('Mesas abiertas al cierre')).not.toBeInTheDocument();
    expect(screen.queryByText(/USD/)).not.toBeInTheDocument();
  });

  it('pendiente explica que falta la lectura posterior', () => {
    render(<CashCloseOpenTables bloque={{ estado: 'pendiente', mesas: 0, detalle: [] }} />);

    expect(screen.getByText('Todavía no llega la lectura de mesas posterior al cierre.')).toBeInTheDocument();
  });

  it('sin_dato explica que no llego la lectura de la noche', () => {
    render(<CashCloseOpenTables bloque={{ estado: 'sin_dato', mesas: 0, detalle: [] }} />);

    expect(screen.getByText('No llegó la lectura de mesas de esa noche.')).toBeInTheDocument();
  });

  it('no pinta nada si el motor no manda el bloque', () => {
    const { container } = render(<CashCloseOpenTables bloque={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });
});
