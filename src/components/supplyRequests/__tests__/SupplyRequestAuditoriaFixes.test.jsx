import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SupplyRequestDetail from '../SupplyRequestDetail';
import PendingReports from '../PendingReports';
import * as client from '../../../services/supplyRequestsClient';

describe('SupplyRequestDetail - Cantidades al aprobar (Brief 28p, punto 28)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const requestWithUndefinedItems = {
    id: 201,
    status: 'pending',
    priority: 'normal',
    requester: { name: 'Carlos Gomez' },
    created_at: '2026-10-31T12:00:00Z',
    items: [
      { id: 11, name: 'Harina de trigo', quantity: null, unit: 'kg' },
      { id: 12, name: 'Azúcar refinada', quantity: null, unit: 'kg' },
    ],
  };

  it('valida cantidades inválidas (abc, 0, negativa) antes de confirmar y no envía la aprobación', async () => {
    const decideSpy = vi.spyOn(client, 'decideRequest').mockResolvedValue({ ok: true });
    vi.spyOn(client, 'getRequest').mockResolvedValue({ ok: true, data: { data: requestWithUndefinedItems } });

    render(<SupplyRequestDetail requestId={201} isOwner={true} userId={1} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/Harina de trigo/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));
    expect(screen.getByText('Fijar cantidades por definir (opcional):')).toBeInTheDocument();

    const inputHarina = screen.getByLabelText(/Harina de trigo/);
    fireEvent.change(inputHarina, { target: { value: 'abc' } });

    const approveButtons = screen.getAllByRole('button', { name: 'Aprobar' });
    fireEvent.click(approveButtons[approveButtons.length - 1]);

    expect(decideSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/Cantidad inválida/)).toBeInTheDocument();

    // Probar con 0
    fireEvent.change(inputHarina, { target: { value: '0' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Aprobar' }).slice(-1)[0]);
    expect(decideSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/Cantidad inválida/)).toBeInTheDocument();

    // Probar con negativo
    fireEvent.change(inputHarina, { target: { value: '-5' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Aprobar' }).slice(-1)[0]);
    expect(decideSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/Cantidad inválida/)).toBeInTheDocument();
  });

  it('permite fijar cantidad válida en un ítem dejando el otro vacío por definir', async () => {
    const decideSpy = vi.spyOn(client, 'decideRequest').mockResolvedValue({ ok: true, data: { data: { ...requestWithUndefinedItems, status: 'approved' } } });
    vi.spyOn(client, 'getRequest').mockResolvedValue({ ok: true, data: { data: requestWithUndefinedItems } });

    render(<SupplyRequestDetail requestId={201} isOwner={true} userId={1} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/Harina de trigo/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));

    const inputHarina = screen.getByLabelText(/Harina de trigo/);
    fireEvent.change(inputHarina, { target: { value: '15.5' } });

    const approveButtons = screen.getAllByRole('button', { name: 'Aprobar' });
    fireEvent.click(approveButtons[approveButtons.length - 1]);

    await waitFor(() => {
      expect(decideSpy).toHaveBeenCalledWith(201, 'approved', '', [{ id: 11, quantity: '15.5' }]);
    });
  });

  it('muestra errores 422 del motor en aviso role="alert" y marca los campos enviados con aria-invalid', async () => {
    vi.spyOn(client, 'getRequest').mockResolvedValue({ ok: true, data: { data: requestWithUndefinedItems } });
    vi.spyOn(client, 'decideRequest').mockResolvedValue({
      ok: false,
      status: 422,
      data: {
        message: 'El ítem ya tiene una cantidad definida.',
      },
    });

    render(<SupplyRequestDetail requestId={201} isOwner={true} userId={1} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/Harina de trigo/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));

    const inputHarina = screen.getByLabelText(/Harina de trigo/);
    const inputAzucar = screen.getByLabelText(/Azúcar refinada/);
    fireEvent.change(inputHarina, { target: { value: '10' } });

    const dialogApproveBtn = screen.getAllByRole('button', { name: 'Aprobar' }).slice(-1)[0];
    fireEvent.click(dialogApproveBtn);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('El ítem ya tiene una cantidad definida.');
      expect(inputHarina).toHaveAttribute('aria-invalid', 'true');
      expect(inputAzucar).toHaveAttribute('aria-invalid', 'false');
    });
  });
});

describe('PendingReports - "Aprobar todos" y listas de fallos (Brief 28p, punto 29)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const reports = [
    {
      id: 501,
      requester_first_name: 'María',
      created_at: '2026-10-31T10:00:00Z',
      priority: 'normal',
      items: [{ id: 1, name: 'Sal' }],
    },
    {
      id: 502,
      requester: { name: 'Jorge Pérez' },
      created_at: '2026-10-31T10:05:00Z',
      priority: 'urgent',
      items: [{ id: 2, name: 'Pimienta' }],
    },
  ];

  it('un éxito individual sin onReload no se reporta como error', async () => {
    vi.spyOn(client, 'decideRequest').mockResolvedValueOnce({ ok: true, data: { data: {} } });

    render(<PendingReports reports={reports} onView={vi.fn()} onReload={undefined} />);

    const approveButtons = screen.getAllByRole('button', { name: 'Aprobar' });
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('en "Aprobar todos" lista los pedidos que fallaron con id, primer nombre y motivo del motor', async () => {
    vi.spyOn(client, 'decideRequest')
      .mockResolvedValueOnce({ ok: true, data: {} }) // 501 pasa
      .mockResolvedValueOnce({ ok: false, status: 422, data: { message: 'El ítem ya tiene una cantidad definida.' } }); // 502 falla

    render(<PendingReports reports={reports} onView={vi.fn()} onReload={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Aprobar todos' }));
    expect(screen.getByText('Se aprobarán 2 pedidos.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar aprobación' }));

    await waitFor(() => {
      expect(screen.getByText(/Se aprobaron 1 de 2 pedidos/)).toBeInTheDocument();
      expect(screen.getByText(/1 con fallo/)).toBeInTheDocument();
      expect(screen.getByText(/#502 · Jorge/)).toBeInTheDocument();
      expect(screen.getByText('El ítem ya tiene una cantidad definida.')).toBeInTheDocument();
    });
  });
});
