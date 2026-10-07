import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CashCloseList from '../CashCloseList';

describe('CashCloseList component', () => {
  const mockCloses = [
    {
      fecha: '2026-10-04',
      status: 'cerrado',
      auto_cerrado: true,
      ventas_del_dia: 500.0,
      diferencia_efectivo: 0.0,
      discrepancias: []
    },
    {
      fecha: '2026-10-05',
      status: 'revision',
      ventas_del_dia: 671.37,
      diferencia_efectivo: -12.4,
      discrepancias: [
        { tipo: 'diferencia_efectivo', motivo: 'Diferencia de efectivo' },
        { tipo: 'sin_conteo_efectivo', motivo: 'Sin conteo' }
      ]
    },
    {
      fecha: '2026-10-03',
      status: 'cerrado',
      auto_cerrado: false,
      ventas_del_dia: 400.0,
      diferencia_efectivo: 2.0,
      discrepancias: []
    }
  ];

  it('ordena los dias en revision primero y muestra el numero de motivos', () => {
    render(<CashCloseList closes={mockCloses} onSelectFecha={() => {}} />);

    const dates = screen.getAllByText(/2026-10-/);
    // El dia en revision (2026-10-05) debe aparecer primero
    expect(dates[0]).toHaveTextContent('2026-10-05');
    expect(screen.getByText('2 motivos')).toBeInTheDocument();
    expect(screen.getByText('En revisión')).toBeInTheDocument();
  });

  it('filtra correctamente con "Solo en revisión"', () => {
    render(<CashCloseList closes={mockCloses} onSelectFecha={() => {}} />);

    expect(screen.getByText('2026-10-04')).toBeInTheDocument();

    const filterBtn = screen.getByText('Solo en revisión');
    fireEvent.click(filterBtn);

    expect(screen.queryByText('2026-10-04')).not.toBeInTheDocument();
    expect(screen.getByText('2026-10-05')).toBeInTheDocument();
  });

  it('llama a onSelectFecha al hacer clic en un cierre', () => {
    const onSelect = vi.fn();
    render(<CashCloseList closes={mockCloses} onSelectFecha={onSelect} />);

    fireEvent.click(screen.getByText('2026-10-05'));
    expect(onSelect).toHaveBeenCalledWith('2026-10-05');
  });
});
