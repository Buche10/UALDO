import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PendingActionCard from '../PendingActionCard';

describe('PendingActionCard component', () => {
  it('renders summary and buttons when action is pending', () => {
    const action = {
      token: 'tok_1',
      action: 'create_order',
      summary: 'Crear pedido de arroz 10kg',
      expires_at: new Date(Date.now() + 300000).toISOString(),
      status: 'pending'
    };

    render(<PendingActionCard action={action} onApprove={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText('Crear pedido de arroz 10kg')).toBeInTheDocument();
    expect(screen.getByText('Aprobar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText(/Acción requerida/i)).toBeInTheDocument();
  });

  it('triggers onApprove and disables on click', async () => {
    const onApprove = vi.fn().mockResolvedValue({});
    const action = {
      token: 'tok_1',
      summary: 'Crear pedido de arroz',
      status: 'pending'
    };

    render(<PendingActionCard action={action} onApprove={onApprove} onCancel={vi.fn()} />);

    const approveBtn = screen.getByText('Aprobar').closest('button');
    fireEvent.click(approveBtn);

    expect(onApprove).toHaveBeenCalledWith('tok_1');
  });

  it('triggers onCancel when clicking cancel', async () => {
    const onCancel = vi.fn().mockResolvedValue({});
    const action = {
      token: 'tok_1',
      summary: 'Crear pedido de arroz',
      status: 'pending'
    };

    render(<PendingActionCard action={action} onApprove={vi.fn()} onCancel={onCancel} />);

    const cancelBtn = screen.getByText('Cancelar').closest('button');
    fireEvent.click(cancelBtn);

    expect(onCancel).toHaveBeenCalledWith('tok_1');
  });

  it('renders terminal state "Hecho" with result message and no buttons', () => {
    const action = {
      token: 'tok_1',
      summary: 'Crear pedido de arroz',
      status: 'done',
      result: 'Pedido #15 creado con éxito.'
    };

    render(<PendingActionCard action={action} onApprove={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText('Hecho')).toBeInTheDocument();
    expect(screen.getByText('Pedido #15 creado con éxito.')).toBeInTheDocument();
    expect(screen.queryByText('Aprobar')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancelar')).not.toBeInTheDocument();
  });

  it('renders terminal state "No se pudo" with error message', () => {
    const action = {
      token: 'tok_1',
      summary: 'Crear pedido de arroz',
      status: 'error',
      error: 'El token expiró o ya fue procesado.'
    };

    render(<PendingActionCard action={action} onApprove={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText('No se pudo')).toBeInTheDocument();
    expect(screen.getByText('El token expiró o ya fue procesado.')).toBeInTheDocument();
    expect(screen.queryByText('Aprobar')).not.toBeInTheDocument();
  });
});
