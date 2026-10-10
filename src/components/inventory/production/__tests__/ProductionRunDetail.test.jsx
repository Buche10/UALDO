import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductionRunDetail from '../ProductionRunDetail';
import * as productionClient from '../../../../services/productionClient';
import { ownerCosts, recordedRun } from '../../../../hooks/__tests__/productionFixtures';

describe('ProductionRunDetail', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the engine metrics and warns a lower yield, without costs or void for staff', () => {
    render(<ProductionRunDetail run={recordedRun} isOwner={false} onBack={vi.fn()} />);

    expect(screen.getByText('60 %')).toBeInTheDocument();
    expect(screen.getByText('70 %')).toBeInTheDocument();
    const diff = screen.getByText('-10 %');
    expect(diff).toHaveStyle({ color: 'var(--warning)' });
    expect(screen.getByText('0,05 kg (1,25 %)')).toBeInTheDocument();
    expect(screen.queryByText('Costo de las entradas')).not.toBeInTheDocument();
    expect(screen.queryByText('Anular')).not.toBeInTheDocument();
  });

  it('shows null metrics as "Sin dato" and a positive difference with sign', () => {
    const run = { ...recordedRun, real_yield_pct: 72.5, yield_difference_pct: 2.5, unaccounted_weight: null, unaccounted_pct: null, main_output_weight: null };
    render(<ProductionRunDetail run={run} isOwner={false} onBack={vi.fn()} />);
    expect(screen.getByText('+2,5 %')).not.toHaveStyle({ color: 'var(--warning)' });
    // Un solo "Sin dato" para el peso sin explicar, nunca "Sin dato (Sin dato)".
    expect(screen.queryByText('Sin dato (Sin dato)')).not.toBeInTheDocument();
    expect(screen.getByText('Peso sin explicar').nextSibling).toHaveTextContent(/^Sin dato$/);
  });

  it('hides the expected amount of a line when the engine did not compute it', () => {
    const run = { ...recordedRun, lines: [{ ...recordedRun.lines[1], expected_quantity: null }] };
    render(<ProductionRunDetail run={run} isOwner={false} onBack={vi.fn()} />);
    expect(screen.queryByText(/Esperado:/)).not.toBeInTheDocument();
  });

  it('after voiding, the focus goes to the heading because the button is gone', async () => {
    vi.spyOn(productionClient, 'voidRun').mockResolvedValue({ ok: true, data: { data: { ...recordedRun, status: 'voided' } } });
    function Harness() {
      const [run, setRun] = React.useState(recordedRun);
      return <ProductionRunDetail run={run} isOwner onBack={vi.fn()} onVoided={setRun} />;
    }
    render(<Harness />);
    fireEvent.click(screen.getByText('Anular').closest('button'));
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Error' } });
    fireEvent.click(screen.getAllByText('Anular').find((el) => el.closest('[role="dialog"]')));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Lomo porcionado' })).toHaveFocus();
  });

  it('keeps Tab inside the void dialog', () => {
    render(<ProductionRunDetail run={recordedRun} isOwner onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Anular').closest('button'));
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Error' } });

    const confirm = screen.getAllByText('Anular').find((el) => el.closest('[role="dialog"]')).closest('button');
    const back = screen.getByText('Volver');
    confirm.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByLabelText('Motivo')).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(confirm).toHaveFocus();
    expect(back).toBeInTheDocument();
  });

  it('shows costs to the owner and warns when they are incomplete', () => {
    const { rerender } = render(<ProductionRunDetail run={{ ...recordedRun, ...ownerCosts }} isOwner onBack={vi.fn()} />);
    expect(screen.getByText('Costo de las entradas')).toBeInTheDocument();
    expect(screen.getByText(/80,00/)).toBeInTheDocument();
    expect(screen.queryByText(/Costo incompleto/)).not.toBeInTheDocument();

    rerender(<ProductionRunDetail run={{ ...recordedRun, cost_status: 'incomplete', input_cost: null }} isOwner onBack={vi.fn()} />);
    expect(screen.getByText(/Costo incompleto/)).toBeInTheDocument();
  });

  it('the owner voids with a required reason and sees the 409 of the engine', async () => {
    const onVoided = vi.fn();
    const spy = vi.spyOn(productionClient, 'voidRun')
      .mockResolvedValueOnce({ ok: false, status: 409, data: { message: "Stock insuficiente para 'Lomo Fino Unidad' en Cocina." } })
      .mockResolvedValueOnce({ ok: true, data: { data: { ...recordedRun, status: 'voided', void_reason: 'Se registró dos veces' } } });
    render(<ProductionRunDetail run={recordedRun} isOwner onBack={vi.fn()} onVoided={onVoided} />);

    fireEvent.click(screen.getByText('Anular'));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const confirm = screen.getAllByText('Anular').find((el) => el.closest('[role="dialog"]'));
    expect(confirm.closest('button')).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Se registró dos veces' } });
    fireEvent.click(confirm);
    await waitFor(() => expect(screen.getByText("Stock insuficiente para 'Lomo Fino Unidad' en Cocina.")).toBeInTheDocument());

    fireEvent.click(confirm);
    await waitFor(() => expect(onVoided).toHaveBeenCalledWith(expect.objectContaining({ status: 'voided' })));
    expect(spy).toHaveBeenLastCalledWith(41, 'Se registró dos veces');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the void dialog with Escape and returns the focus', () => {
    render(<ProductionRunDetail run={recordedRun} isOwner onBack={vi.fn()} />);
    const trigger = screen.getByText('Anular').closest('button');
    fireEvent.click(trigger);
    expect(screen.getByLabelText('Motivo')).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('a voided run shows its reason and no void button', () => {
    render(<ProductionRunDetail run={{ ...recordedRun, status: 'voided', void_reason: 'Error de pesaje' }} isOwner onBack={vi.fn()} />);
    expect(screen.getByText('Motivo de la anulación: Error de pesaje')).toBeInTheDocument();
    expect(screen.queryByText('Anular')).not.toBeInTheDocument();
  });

  it('shows names and notes as plain text', () => {
    const xss = '<img src=x onerror=alert(1)>';
    const { container } = render(
      <ProductionRunDetail run={{ ...recordedRun, template_name: xss, notes: xss, lines: [{ ...recordedRun.lines[0], item_name: xss }] }} isOwner={false} onBack={vi.fn()} />
    );
    expect(screen.getAllByText((text) => text.includes(xss)).length).toBeGreaterThan(0);
    expect(container.querySelector('img')).toBeNull();
  });
});
