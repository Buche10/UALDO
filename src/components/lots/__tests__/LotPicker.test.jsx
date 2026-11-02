import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LotPicker from '../LotPicker';
import * as lotsClient from '../../../services/lotsClient';
import { emptyLotSelection } from '../../../services/lotSelection';

const lots = [
  {
    id: 12,
    code: 'L0001',
    status: 'activo',
    received_on: '2026-11-01',
    balances: [{ item_id: 4, item: 'Bife de res', location: 'kitchen', location_label: 'Cocina', quantity: 10 }],
  },
  {
    id: 13,
    code: 'L0002',
    status: 'activo',
    received_on: '2026-11-02',
    balances: [{ item_id: 4, item: 'Bife de res', location: 'kitchen', location_label: 'Cocina', quantity: 5 }],
  },
];

function Harness() {
  const [value, setValue] = useState(emptyLotSelection());
  return (
    <LotPicker
      itemId={4}
      itemName="Bife de res"
      unit="kg"
      location="kitchen"
      requiresLot
      value={value}
      onChange={setValue}
    />
  );
}

describe('LotPicker (Brief 40p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(lotsClient, 'getNextLot').mockResolvedValue({
      ok: true,
      data: { data: { lot_id: 12, code: 'L0001', quantity: 10, received_on: '2026-11-01' } },
    });
    vi.spyOn(lotsClient, 'listLots').mockResolvedValue({ ok: true, data: { data: lots } });
  });

  it('preselecciona el lote recomendado con código, saldo y días', async () => {
    render(<Harness />);

    expect(await screen.findByText(/Recomendado: L0001/)).toBeInTheDocument();
    const select = screen.getByLabelText('Elige el lote');
    await waitFor(() => expect(select.value).toBe('12'));
    expect(screen.getByText(/L0001 · .*kg · .*días/)).toBeInTheDocument();
  });

  it('al elegir otro lote pide el motivo con el texto exacto y lo envía', async () => {
    render(<Harness />);
    const select = await screen.findByLabelText('Elige el lote');
    fireEvent.change(select, { target: { value: '13' } });

    expect(await screen.findByText('Hay un lote más antiguo (L0001). ¿Por qué usas L0002?')).toBeInTheDocument();

    const reason = screen.getByLabelText(/Motivo \(5 a 300 caracteres\)/);
    fireEvent.change(reason, { target: { value: 'Reservado para el evento' } });
    expect(reason.value).toBe('Reservado para el evento');
    expect(screen.queryByText(/Escribe el motivo completo/)).toBeNull();
  });

  it('muestra el aviso de motivo incompleto y no oculta el campo', async () => {
    render(<Harness />);
    const select = await screen.findByLabelText('Elige el lote');
    fireEvent.change(select, { target: { value: '13' } });
    fireEvent.change(await screen.findByLabelText(/Motivo \(5 a 300 caracteres\)/), { target: { value: 'abc' } });
    expect(screen.getByText('Escribe el motivo completo (5 a 300 caracteres).')).toBeInTheDocument();
  });

  it('no se muestra cuando el insumo no controla lote', () => {
    const { container } = render(
      <LotPicker itemId={4} location="kitchen" requiresLot={false} value={emptyLotSelection()} onChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });
});
