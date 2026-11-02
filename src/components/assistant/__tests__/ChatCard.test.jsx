import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatCard from '../ChatCard';

describe('ChatCard (Brief 42p)', () => {
  it('dibuja una lista con subtítulo y distintivo', () => {
    render(
      <ChatCard card={{
        type: 'list',
        title: 'Pedidos por aprobar',
        items: [
          { title: 'Pedido #102 - Marcos', subtitle: '20.0 kg Lomo de asado', badge: 'Urgente', badge_tone: 'warning' },
          { title: 'Pedido #103 - Danny', subtitle: '10.0 kg Arroz flor', badge: 'Normal', badge_tone: 'neutral' },
        ],
      }} />
    );

    expect(screen.getByText('Pedidos por aprobar')).toBeInTheDocument();
    expect(screen.getByText('Pedido #102 - Marcos')).toBeInTheDocument();
    expect(screen.getByText('20.0 kg Lomo de asado')).toBeInTheDocument();
    expect(screen.getByText('Urgente')).toHaveClass('warning');
  });

  it('dibuja una tabla con columnas y etiquetas para apilar en el teléfono', () => {
    render(
      <ChatCard card={{
        type: 'table',
        title: 'Insumos bajo mínimo',
        columns: ['Insumo', 'Stock', 'Estado'],
        rows: [['Tomate riñón', '1.5 kg', 'Bajo mínimo'], ['Aceite vegetal', '0.0 l', 'Sin stock']],
      }} />
    );

    expect(screen.getByText('Insumos bajo mínimo')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Insumo' })).toBeInTheDocument();
    expect(screen.getByText('Tomate riñón')).toHaveAttribute('data-label', 'Insumo');
    expect(screen.getByText('Sin stock')).toHaveAttribute('data-label', 'Estado');
  });

  it('dibuja las métricas de una tarjeta stat', () => {
    render(
      <ChatCard card={{
        type: 'stat',
        title: 'Resumen de ventas (ayer)',
        items: [
          { label: 'Total vendido', value: '$1,450.25' },
          { label: 'Pedidos', value: '86' },
        ],
      }} />
    );

    expect(screen.getByText('Resumen de ventas (ayer)')).toBeInTheDocument();
    expect(screen.getByText('Total vendido')).toBeInTheDocument();
    expect(screen.getByText('$1,450.25')).toBeInTheDocument();
    expect(screen.getByText('86')).toBeInTheDocument();
  });

  it('ignora un tipo desconocido sin romper la conversación', () => {
    const { container } = render(
      <div>
        <ChatCard card={{ type: 'chart', title: 'No soportada' }} />
        <span>Mensaje siguiente</span>
      </div>
    );

    expect(screen.queryByText('No soportada')).not.toBeInTheDocument();
    expect(screen.getByText('Mensaje siguiente')).toBeInTheDocument();
    expect(container.querySelector('.chat-card')).toBeNull();
  });

  it('tolera tarjetas malformadas', () => {
    const { container } = render(
      <div>
        <ChatCard card={{ type: 'list' }} />
        <ChatCard card={{ type: 'table', columns: [], rows: [] }} />
        <ChatCard card={{ type: 'stat', items: null }} />
      </div>
    );
    expect(container.querySelectorAll('.chat-list-item')).toHaveLength(0);
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelectorAll('.chat-stat')).toHaveLength(0);
  });
});
