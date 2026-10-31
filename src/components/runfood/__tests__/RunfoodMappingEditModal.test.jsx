import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RunfoodMappingEditModal from '../RunfoodMappingEditModal';
import * as inventoryClient from '../../../services/inventoryClient';

describe('RunfoodMappingEditModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders modal with existing item and allows changing factor and submitting', async () => {
    const onSave = vi.fn().mockResolvedValue();
    const onClose = vi.fn();
    const mapping = {
      id: 12,
      runfood_article: { descripcion: 'Carne picada 100g' },
      inventory_item: { id: 30, name: 'Carne Molida', unit: 'kg' },
      factor: '0.1'
    };

    render(
      <RunfoodMappingEditModal
        isOpen={true}
        mapping={mapping}
        onSave={onSave}
        onClose={onClose}
        submitting={false}
        error={null}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Carne picada 100g')).toBeInTheDocument();
    expect(screen.getByText('Carne Molida (kg)')).toBeInTheDocument();
    expect(screen.getByText('Cuántas unidades de Carne Molida (kg) equivalen a 1 unidad de RunFood de Carne picada 100g.')).toBeInTheDocument();

    const factorInput = screen.getByDisplayValue('0.1');
    fireEvent.change(factorInput, { target: { value: '0.2' } });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar insumo' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(12, {
        inventory_item_id: 30,
        factor: '0.2'
      });
    });
  });

  it('allows clicking Cambiar, searching item and selecting from results', async () => {
    vi.spyOn(inventoryClient, 'listInventory').mockResolvedValue({
      ok: true,
      data: {
        items: [{ id: 99, name: 'Queso Mozzarella', unit: 'kg' }]
      }
    });

    const onSave = vi.fn().mockResolvedValue();
    const onClose = vi.fn();
    const mapping = {
      id: 14,
      runfood_article: { descripcion: 'Queso porcion' },
      inventory_item: { id: 30, name: 'Carne Molida', unit: 'kg' },
      factor: '1'
    };

    render(
      <RunfoodMappingEditModal
        isOpen={true}
        mapping={mapping}
        onSave={onSave}
        onClose={onClose}
        submitting={false}
        error={null}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar' }));

    const searchInput = screen.getByPlaceholderText(/Escribe al menos 2 letras\.\.\./i);
    fireEvent.change(searchInput, { target: { value: 'Que' } });

    await waitFor(() => {
      expect(screen.getByText('Queso Mozzarella')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Queso Mozzarella'));

    expect(screen.getByText('Queso Mozzarella (kg)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar insumo' }));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(14, {
        inventory_item_id: 99,
        factor: '1'
      });
    });
  });

  it('validates invalid factor and displays validation error', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const mapping = {
      id: 15,
      runfood_article: { descripcion: 'Sal' },
      inventory_item: { id: 2, name: 'Sal fina', unit: 'kg' },
      factor: '1'
    };

    render(
      <RunfoodMappingEditModal
        isOpen={true}
        mapping={mapping}
        onSave={onSave}
        onClose={onClose}
        submitting={false}
        error={null}
      />
    );

    const factorInput = screen.getByDisplayValue('1');
    fireEvent.change(factorInput, { target: { value: '-5' } });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar insumo' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('El factor debe ser mayor a 0 y hasta 100000 con máximo 6 decimales.');
  });

  it('muestra errores 422 junto a los campos correspondientes sin alerta general', () => {
    const mapping = {
      id: 16,
      runfood_article: { descripcion: 'Pimienta' },
      inventory_item: { id: 5, name: 'Pimienta Negra', unit: 'g' },
      factor: '10'
    };

    render(
      <RunfoodMappingEditModal
        isOpen={true}
        mapping={mapping}
        onSave={vi.fn()}
        onClose={vi.fn()}
        submitting={false}
        error="Error de validación"
        fieldErrors={{
          factor: ['El factor no puede superar 100000.'],
          inventory_item_id: ['El insumo no es válido.']
        }}
      />
    );

    // No debe haber alerta general porque hay errores por campo
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('El factor no puede superar 100000.')).toBeInTheDocument();
    expect(screen.getByText('El insumo no es válido.')).toBeInTheDocument();
  });

  it('llama a onClearErrors al abrir el modal para limpiar errores viejos', () => {
    const onClearErrors = vi.fn();
    const mapping = {
      id: 17,
      runfood_article: { descripcion: 'Orégano' },
      inventory_item: null,
      factor: '1'
    };

    render(
      <RunfoodMappingEditModal
        isOpen={true}
        mapping={mapping}
        onSave={vi.fn()}
        onClose={vi.fn()}
        submitting={false}
        error="Error viejo"
        onClearErrors={onClearErrors}
      />
    );

    expect(onClearErrors).toHaveBeenCalledTimes(1);
  });
});
