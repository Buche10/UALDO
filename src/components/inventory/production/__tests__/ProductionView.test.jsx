import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductionView from '../ProductionView';
import * as productionClient from '../../../../services/productionClient';
import { lomoTemplate, recordedRun, burgerTemplate } from '../../../../hooks/__tests__/productionFixtures';

describe('ProductionView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(productionClient, 'listRuns').mockResolvedValue({ ok: true, data: { data: [], meta: { current_page: 1, last_page: 1 } } });
    vi.spyOn(productionClient, 'listTemplates').mockResolvedValue({ ok: true, data: { data: [lomoTemplate, burgerTemplate] } });
    vi.spyOn(productionClient, 'getPlan').mockResolvedValue({
      ok: true,
      data: { data: { inputs: [{ item_id: 1, expected_quantity: 4 }], outputs: [{ item_id: 2, expected_quantity: 8 }, { item_id: 4, expected_quantity: 0.92 }] } },
    });
  });

  it('a member picks a template, sees the engine plan, records and sees the result', async () => {
    const record = vi.spyOn(productionClient, 'recordRun').mockResolvedValue({ ok: true, status: 201, data: { status: 'created', data: recordedRun } });
    render(<ProductionView isOwner={false} onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Todavía no hay producciones registradas.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Nuevo porcionado'));
    await waitFor(() => expect(screen.getByText('Lomo porcionado')).toBeInTheDocument());
    expect(screen.getByText('Rendimiento esperado 70 %')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Lomo porcionado'));

    expect(screen.getByLabelText('Peso de las porciones (kg) (obligatorio)')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Lomo Fino Kg'), { target: { value: '4' } });
    await waitFor(() => expect(screen.getByText('Esperado: 0,92 kg')).toBeInTheDocument(), { timeout: 2000 });
    expect(productionClient.getPlan).toHaveBeenCalledWith(3, '4');

    fireEvent.change(screen.getByLabelText('Lomo Fino Unidad'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Peso de las porciones (kg) (obligatorio)'), { target: { value: '2.4' } });
    fireEvent.change(screen.getByLabelText('Merma que se tira (kg) (obligatorio)'), { target: { value: '0.65' } });
    fireEvent.click(screen.getByText('Registrar porcionado'));

    await waitFor(() => expect(screen.getByText('Producción registrada.')).toBeInTheDocument());
    expect(record.mock.calls[0][0].outputs).toEqual([{ item_id: 2, quantity: '8' }]);
    expect(screen.getByText('Rendimiento real')).toBeInTheDocument();
    expect(screen.getByText('-10 %')).toBeInTheDocument();
  });

  it('a sum-scaled template explains that the expected amounts come at the end', async () => {
    render(<ProductionView isOwner={false} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Nuevo porcionado')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Nuevo porcionado'));
    await waitFor(() => expect(screen.getByText('Carne Hamburguesas')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Carne Hamburguesas'));

    expect(screen.getByText('Las cantidades esperadas se calculan al registrar.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Merma de lomo'), { target: { value: '1' } });
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(productionClient.getPlan).not.toHaveBeenCalled();
  });

  it('shows the 409 of the engine on the form', async () => {
    vi.spyOn(productionClient, 'recordRun').mockResolvedValue({ ok: false, status: 409, data: { message: "Stock insuficiente para 'Lomo Fino Kg' en Cocina." } });
    render(<ProductionView isOwner={false} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Nuevo porcionado')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Nuevo porcionado'));
    await waitFor(() => expect(screen.getByText('Lomo porcionado')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Lomo porcionado'));

    fireEvent.change(screen.getByLabelText('Lomo Fino Kg'), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText('Lomo Fino Unidad'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Peso de las porciones (kg) (obligatorio)'), { target: { value: '28' } });
    fireEvent.change(screen.getByLabelText('Merma que se tira (kg) (obligatorio)'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Registrar porcionado'));

    await waitFor(() => expect(screen.getByText("Stock insuficiente para 'Lomo Fino Kg' en Cocina.")).toBeInTheDocument());
  });

  it('opens a run from the list, loads more and goes back to inventory', async () => {
    productionClient.listRuns
      .mockResolvedValueOnce({ ok: true, data: { data: [recordedRun], meta: { current_page: 1, last_page: 2 } } })
      .mockResolvedValueOnce({ ok: true, data: { data: [{ ...recordedRun, id: 40, status: 'voided' }], meta: { current_page: 2, last_page: 2 } } });
    const onBack = vi.fn();
    render(<ProductionView isOwner={false} onBack={onBack} />);

    await waitFor(() => expect(screen.getByText('Rendimiento 60 %')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Cargar más'));
    await waitFor(() => expect(screen.getByText('Anulada')).toBeInTheDocument());

    fireEvent.click(screen.getAllByText('Lomo porcionado')[0]);
    expect(screen.getByText('Volver a producciones')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Volver a producciones'));
    fireEvent.click(screen.getByText('Inventario'));
    expect(onBack).toHaveBeenCalled();
  });
});
