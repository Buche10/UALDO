import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CashConfigView from '../CashConfigView';
import * as auth from '../../../services/auth';
import * as cashConfigClient from '../../../services/cashConfigClient';

describe('CashConfigView component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('bloquea al personal sin is_owner sin realizar peticiones a la API tras asentar efectos', async () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({
      id: 2,
      name: 'Mesero',
      capabilities: { is_owner: false }
    });

    const listMappingsSpy = vi.spyOn(cashConfigClient, 'listPaymentMappings').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [] }
    });
    const getRatesSpy = vi.spyOn(cashConfigClient, 'getCommissionRates').mockResolvedValue({
      ok: true,
      status: 200,
      data: { current: [], history: [] }
    });

    render(<CashConfigView onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Acceso Restringido')).toBeInTheDocument();
      expect(screen.getByText('Solo el dueño puede configurar la caja.')).toBeInTheDocument();
    });

    // Aseguramos que tras resolver los efectos no se hizo ninguna peticion
    expect(listMappingsSpy).not.toHaveBeenCalled();
    expect(getRatesSpy).not.toHaveBeenCalled();
  });

  it('permite al dueno alternar entre pestañas de formas de pago y comisiones', async () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({
      id: 1,
      name: 'Dueno',
      capabilities: { is_owner: true }
    });

    vi.spyOn(cashConfigClient, 'listPaymentMappings').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [] }
    });
    vi.spyOn(cashConfigClient, 'getCommissionRates').mockResolvedValue({
      ok: true,
      status: 200,
      data: { current: [], history: [] }
    });

    render(<CashConfigView onBack={() => {}} initialTab="mappings" />);

    await waitFor(() => {
      expect(screen.getByText('Formas de Pago de RunFood')).toBeInTheDocument();
    });

    const commTabBtn = screen.getByRole('button', { name: /Comisiones/i });
    fireEvent.click(commTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Tasas de Comisión de Tarjetas')).toBeInTheDocument();
    });
  });

  it('inicia en la pestaña comisiones si se provee initialTab="commissions"', async () => {
    vi.spyOn(auth, 'getUser').mockReturnValue({
      id: 1,
      name: 'Dueno',
      capabilities: { is_owner: true }
    });

    vi.spyOn(cashConfigClient, 'listPaymentMappings').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [] }
    });
    vi.spyOn(cashConfigClient, 'getCommissionRates').mockResolvedValue({
      ok: true,
      status: 200,
      data: { current: [], history: [] }
    });

    render(<CashConfigView onBack={() => {}} initialTab="commissions" />);

    await waitFor(() => {
      expect(screen.getByText('Tasas de Comisión de Tarjetas')).toBeInTheDocument();
    });
  });

  it('llama a onBack al hacer clic en volver', async () => {
    const onBackMock = vi.fn();
    vi.spyOn(auth, 'getUser').mockReturnValue({
      id: 1,
      name: 'Dueno',
      capabilities: { is_owner: true }
    });

    vi.spyOn(cashConfigClient, 'listPaymentMappings').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [] }
    });

    render(<CashConfigView onBack={onBackMock} />);

    await waitFor(() => {
      expect(screen.getByText('Formas de Pago de RunFood')).toBeInTheDocument();
    });

    const backBtn = screen.getByRole('button', { name: /Volver a la caja/i });
    fireEvent.click(backBtn);
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });
});
