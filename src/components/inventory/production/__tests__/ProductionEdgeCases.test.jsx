import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductionLineField from '../ProductionLineField';
import ProductionRunForm from '../ProductionRunForm';
import ProductionTemplatePicker from '../ProductionTemplatePicker';
import ProductionRunList from '../ProductionRunList';
import { formatDate, formatMoney, formatSignedPct, runLocation, formatKg } from '../productionFormat';
import * as productionClient from '../../../../services/productionClient';
import { lomoTemplate, recordedRun } from '../../../../hooks/__tests__/productionFixtures';

describe('ProductionLineField', () => {
  it('marks main outputs, shows the expected amount, the error and the disabled state', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ProductionLineField fieldKey="output:2" label="Lomo Fino Unidad" unit="unit" value="8" expected={8} isMain error="Se esperaban 8." onChange={onChange} disabled={false} />
    );
    expect(screen.getByText('Principal')).toBeInTheDocument();
    expect(screen.getByText('Esperado: 8 unit')).toBeInTheDocument();
    expect(screen.getByText('Se esperaban 8.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Lomo Fino Unidad'), { target: { value: '9' } });
    expect(onChange).toHaveBeenCalledWith('output:2', '9');

    rerender(<ProductionLineField fieldKey="input:1" label="Lomo Fino Kg" value="" expected={null} onChange={onChange} disabled />);
    expect(screen.queryByText('Principal')).not.toBeInTheDocument();
    expect(screen.queryByText(/Esperado/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Lomo Fino Kg')).toBeDisabled();
  });
});

describe('ProductionRunForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(productionClient, 'getPlan').mockResolvedValue({ ok: true, data: { data: { inputs: [], outputs: [] } } });
  });

  it('shows general errors, falls back to the item id and changes location and notes', async () => {
    const record = vi.spyOn(productionClient, 'recordRun').mockResolvedValue({
      ok: false, status: 422, data: { message: 'Datos inválidos.', errors: { outputs: ['Registra al menos una salida principal mayor que 0.'] } },
    });
    const template = { ...lomoTemplate, requires_weight_control: false, requires_waste_record: false, default_location: null, inputs: [{ item_id: 1, unit: 'kg', is_primary: true }] };
    render(<ProductionRunForm template={template} onBack={vi.fn()} onRecorded={vi.fn()} />);

    expect(screen.getByLabelText('Ubicación')).toHaveValue('kitchen');
    fireEvent.click(screen.getByText('Registrar porcionado'));
    expect(screen.getByText('Registra al menos una entrada.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Insumo 1'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Filete De Res'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Ubicación'), { target: { value: 'warehouse' } });
    fireEvent.change(screen.getByLabelText('Notas (opcional)'), { target: { value: 'Pieza grande' } });
    fireEvent.click(screen.getByText('Registrar porcionado'));

    await waitFor(() => expect(screen.getByText('Registra al menos una salida principal mayor que 0.')).toBeInTheDocument());
    expect(record.mock.calls[0][0]).toEqual(expect.objectContaining({ location: 'warehouse', notes: 'Pieza grande' }));
  });
});

describe('ProductionRunForm plan status', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('says it is calculating, then that the plan failed, and shows general engine errors', async () => {
    let resolvePlan;
    vi.spyOn(productionClient, 'getPlan').mockImplementation(() => new Promise((resolve) => { resolvePlan = resolve; }));
    vi.spyOn(productionClient, 'recordRun').mockResolvedValue({ ok: false, status: 422, data: { message: 'Datos inválidos.', errors: { location: ['La ubicación no es válida.'] } } });
    render(<ProductionRunForm template={{ ...lomoTemplate, requires_weight_control: false, requires_waste_record: false }} onBack={vi.fn()} onRecorded={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Lomo Fino Kg'), { target: { value: '4' } });
    expect(screen.getByText('Calculando lo esperado...')).toBeInTheDocument();
    await waitFor(() => expect(productionClient.getPlan).toHaveBeenCalled(), { timeout: 2000 });
    resolvePlan({ ok: false, status: 500 });
    await waitFor(() => expect(screen.getByText('No se pudo calcular lo esperado; puedes registrar igual.')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Registrar porcionado'));
    await waitFor(() => expect(screen.getByText('La ubicación no es válida.')).toBeInTheDocument());
  });
});

describe('ProductionTemplatePicker', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retries after an error and explains when there are no templates', async () => {
    vi.spyOn(productionClient, 'listTemplates')
      .mockResolvedValueOnce({ ok: false, status: 0, error: 'Sin conexión' })
      .mockResolvedValueOnce({ ok: true, data: { data: [] } });
    render(<ProductionTemplatePicker onPick={vi.fn()} onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Sin conexión')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Reintentar'));
    await waitFor(() => expect(screen.getByText('No hay fichas activas. Se importan desde DobleFilo.')).toBeInTheDocument());
  });
});

describe('ProductionRunList', () => {
  it('shows the error with retry and a loading state', () => {
    const onReload = vi.fn();
    const { rerender } = render(<ProductionRunList runs={[]} loading={false} error="Error 500" hasMore={false} onReload={onReload} onOpen={vi.fn()} onNew={vi.fn()} onLoadMore={vi.fn()} />);
    fireEvent.click(screen.getByText('Reintentar'));
    expect(onReload).toHaveBeenCalled();
    expect(screen.queryByText('Todavía no hay producciones registradas.')).not.toBeInTheDocument();

    rerender(<ProductionRunList runs={[]} loading error={null} hasMore={false} onReload={onReload} onOpen={vi.fn()} onNew={vi.fn()} onLoadMore={vi.fn()} />);
    expect(screen.getByText('Cargando producciones...')).toBeInTheDocument();

    rerender(<ProductionRunList runs={[recordedRun]} loading error={null} hasMore onReload={onReload} onOpen={vi.fn()} onNew={vi.fn()} onLoadMore={vi.fn()} />);
    expect(screen.getByText('Cargando más...')).toBeInTheDocument();
  });
});

describe('productionFormat', () => {
  it('formats engine values and missing data', () => {
    expect(formatMoney(null)).toBe('Sin dato');
    expect(formatMoney('abc')).toBe('Sin dato');
    expect(formatMoney(5.625)).toContain('5,625');
    expect(formatSignedPct(null)).toBe('Sin dato');
    expect(formatSignedPct(0)).toBe('0 %');
    expect(formatKg(null)).toBe('Sin dato');
    expect(runLocation({ location: 'warehouse' })).toBe('Bodega');
    expect(runLocation(null)).toBe('Sin ubicación');
    expect(formatDate(null)).toBe('');
    expect(formatDate('no es fecha')).toBe('');
  });
});
