import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActivityItem from '../ActivityItem';

describe('ActivityItem (Brief 46p)', () => {
  it('con referencia a reserva abre la pantalla de reserva mediante onNavigate', () => {
    const onNavigate = vi.fn();
    const item = {
      id: 1,
      fecha: '2026-11-06T14:30:00Z',
      modulo: 'reservas',
      modulo_label: 'Reservas',
      descripcion: 'Confirmó la reserva para 4 personas.',
      persona: { id: 2, nombre: 'Carla Recepción', cargo_label: 'Salón' },
      referencia: { tipo: 'Reserva', id: 42 },
    };

    render(<ActivityItem item={item} onNavigate={onNavigate} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Reservas')).toBeInTheDocument();
    expect(screen.getByText(/Carla Recepción \(Salón\)/i)).toBeInTheDocument();
    expect(screen.getByText('Confirmó la reserva para 4 personas.')).toBeInTheDocument();

    fireEvent.click(button);
    expect(onNavigate).toHaveBeenCalledWith({
      tab: 'mas',
      subView: 'reservations',
      params: { id: 42 },
    });
  });

  it('con tipo desconocido o sin referencia no es pulsable y no llama a onNavigate', () => {
    const onNavigate = vi.fn();
    const item = {
      id: 2,
      fecha: '2026-11-06T10:15:00Z',
      modulo: 'inventario',
      modulo_label: 'Inventario',
      descripcion: 'Actualizó el insumo Tomate riñón.',
      persona: { id: null, nombre: 'Sistema' },
      referencia: { tipo: 'Insumo', id: 8 },
    };

    render(<ActivityItem item={item} onNavigate={onNavigate} />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Sistema')).toBeInTheDocument();
    expect(screen.getByText('Actualizó el insumo Tomate riñón.')).toBeInTheDocument();
  });
});
