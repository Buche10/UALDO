import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WithdrawalsView from '../WithdrawalsView';
import * as withdrawalsClient from '../../../services/withdrawalsClient';
import { ABILITIES } from '../../../services/permissions';

describe('WithdrawalsView (Brief 32p & 32p_fix)', () => {
  const mockWithdrawals = [
    {
      id: 1,
      user_id: 10,
      status: 'open',
      created_at: new Date(Date.now() - 5 * 60000).toISOString(),
      to_location: 'kitchen',
      purpose: 'Producción pan',
      lines: [{ id: 1, item_name: 'Harina', quantity: '10.000', unit: 'kg' }],
    },
    {
      id: 2,
      user_id: 20,
      status: 'open',
      created_at: new Date(Date.now() - 10 * 60000).toISOString(),
      to_location: 'kitchen',
      user: { id: 20, name: 'Lucas Silva' },
      purpose: 'Salsa',
      lines: [{ id: 2, item_name: 'Tomate', quantity: '5.000', unit: 'kg' }],
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(withdrawalsClient, 'listWithdrawals').mockResolvedValue({
      ok: true,
      data: mockWithdrawals,
    });
  });

  it('un trabajador común solo ve "Mis retiros" y no ve la pestaña "Mi área"', async () => {
    const user = {
      id: 10,
      area: 'kitchen',
      capabilities: { abilities: [ABILITIES.WITHDRAWALS_DECLARE] },
    };

    render(<WithdrawalsView user={user} />);

    expect(await screen.findByText('Producción pan')).toBeInTheDocument();
    expect(screen.queryByText('Mi área')).not.toBeInTheDocument();
    expect(screen.queryByText('Lucas')).not.toBeInTheDocument();
  });

  it('un supervisor ve ambas pestañas ("Mis retiros" y "Mi área")', async () => {
    const supervisor = {
      id: 10,
      area: 'kitchen',
      capabilities: {
        abilities: [ABILITIES.WITHDRAWALS_DECLARE, ABILITIES.WITHDRAWALS_SUPERVISE],
      },
    };

    render(<WithdrawalsView user={supervisor} />);

    expect(await screen.findByText(/Mis retiros/i)).toBeInTheDocument();
    const areaTab = screen.getByText(/Mi área/i);
    expect(areaTab).toBeInTheDocument();

    // Cambiar a Mi área
    fireEvent.click(areaTab);

    // Debe mostrar retiros del área (incluyendo el de Lucas con su nombre)
    expect(await screen.findByText('Por Lucas')).toBeInTheDocument();
  });

  it('permite cambiar a la vista de declarar retiro y volver', async () => {
    const user = {
      id: 10,
      capabilities: { abilities: [ABILITIES.WITHDRAWALS_DECLARE] },
    };

    render(<WithdrawalsView user={user} />);

    const declareBtn = await screen.findByRole('button', { name: /Declarar retiro/i });
    fireEvent.click(declareBtn);

    expect(await screen.findByText('Declarar retiro de bodega')).toBeInTheDocument();

    // Cancelar y volver
    fireEvent.click(screen.getByRole('button', { name: /Volver a retiros/i }));
    expect(await screen.findByText('Producción pan')).toBeInTheDocument();
  });

  it('permite cambiar a la vista de cerrar retiro y volver', async () => {
    const user = {
      id: 10,
      capabilities: { abilities: [ABILITIES.WITHDRAWALS_DECLARE] },
    };

    render(<WithdrawalsView user={user} />);

    const closeBtn = await screen.findByRole('button', { name: /Cerrar retiro/i });
    fireEvent.click(closeBtn);

    expect(await screen.findByText('Confirmar cierre de retiro')).toBeInTheDocument();

    // Volver
    fireEvent.click(screen.getByRole('button', { name: /Volver/i }));
    expect(await screen.findByText('Producción pan')).toBeInTheDocument();
  });

  it('abre el modal de cancelar al pulsar Cancelar y recarga al confirmar', async () => {
    vi.spyOn(withdrawalsClient, 'cancelWithdrawal').mockResolvedValue({
      ok: true,
      data: { id: 1, status: 'cancelled' },
    });

    const user = {
      id: 10,
      capabilities: { abilities: [ABILITIES.WITHDRAWALS_DECLARE] },
    };

    render(<WithdrawalsView user={user} />);

    const cancelBtn = await screen.findByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    // En el modal
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Cancelar retiro/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('muestra error si la carga falla', async () => {
    vi.spyOn(withdrawalsClient, 'listWithdrawals').mockResolvedValue({
      ok: false,
      error: 'Fallo de red en retiros.',
    });

    render(
      <WithdrawalsView
        user={{ id: 10, capabilities: { abilities: [ABILITIES.WITHDRAWALS_DECLARE] } }}
      />
    );

    expect(await screen.findByText('Fallo de red en retiros.')).toBeInTheDocument();
  });

  it('el caso de initialId abre el cierre con las líneas y muestra el nombre del insumo', async () => {
    const singleWithdrawal = {
      id: 99,
      status: 'open',
      to_location: 'kitchen',
      purpose: 'Torta de chocolate',
      lines: [
        { id: 201, item_name: 'Cacao amargo en polvo', quantity: '2.500', unit: 'kg' },
      ],
    };

    vi.spyOn(withdrawalsClient, 'getWithdrawal').mockResolvedValue({
      ok: true,
      data: singleWithdrawal,
    });

    render(
      <WithdrawalsView
        user={{ id: 10, capabilities: { abilities: [ABILITIES.WITHDRAWALS_DECLARE] } }}
        initialId={99}
      />
    );

    expect(await screen.findByText('Confirmar cierre de retiro')).toBeInTheDocument();
    expect(screen.getByText('Cacao amargo en polvo')).toBeInTheDocument();
  });

  it('si initialId ya no está open ni escalated muestra el error sin abrir el cierre', async () => {
    const closedWithdrawal = {
      id: 88,
      status: 'closed',
      purpose: 'Mise en place',
      lines: [],
    };

    vi.spyOn(withdrawalsClient, 'getWithdrawal').mockResolvedValue({
      ok: true,
      data: closedWithdrawal,
    });

    render(
      <WithdrawalsView
        user={{ id: 10, capabilities: { abilities: [ABILITIES.WITHDRAWALS_DECLARE] } }}
        initialId={88}
      />
    );

    expect(await screen.findByText('Ese retiro ya se cerró o se canceló.')).toBeInTheDocument();
    expect(screen.queryByText('Confirmar cierre de retiro')).not.toBeInTheDocument();
  });

  it('soporta paginación y permite cargar más registros con Ver más', async () => {
    const page1Data = {
      data: [mockWithdrawals[0]],
      meta: { current_page: 1, last_page: 2 },
    };
    const page2Data = {
      data: [
        {
          id: 3,
          user_id: 10,
          status: 'open',
          purpose: 'Pan integral',
          lines: [{ id: 3, item_name: 'Levadura', quantity: '0.100', unit: 'kg' }],
        },
      ],
      meta: { current_page: 2, last_page: 2 },
    };

    const listSpy = vi.spyOn(withdrawalsClient, 'listWithdrawals')
      .mockResolvedValueOnce({ ok: true, data: page1Data })
      .mockResolvedValueOnce({ ok: true, data: page2Data });

    render(
      <WithdrawalsView
        user={{ id: 10, capabilities: { abilities: [ABILITIES.WITHDRAWALS_DECLARE] } }}
      />
    );

    expect(await screen.findByText('Producción pan')).toBeInTheDocument();
    const verMasBtn = screen.getByRole('button', { name: /Ver más/i });
    expect(verMasBtn).toBeInTheDocument();

    fireEvent.click(verMasBtn);

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith({ page: 2 });
      expect(screen.getByText('Pan integral')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Ver más/i })).not.toBeInTheDocument();
    });
  });
});
