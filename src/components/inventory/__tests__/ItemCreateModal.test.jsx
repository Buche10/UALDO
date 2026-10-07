import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ItemCreateModal from '../ItemCreateModal';
import * as inventoryClient from '../../../services/inventoryClient';

describe('ItemCreateModal component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders modal form for creating an item', () => {
    render(<ItemCreateModal isOpen={true} onClose={vi.fn()} onItemCreated={vi.fn()} />);

    expect(screen.getByText('Nuevo Insumo')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre del insumo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Unidad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Stock m[ií]nimo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Punto de reorden/i)).toBeInTheDocument();
  });

  it('handles 403 Forbidden with clear permission message', async () => {
    vi.spyOn(inventoryClient, 'createItem').mockResolvedValue({
      ok: false,
      status: 403,
      error: 'Solo el dueño puede crear insumos.',
    });

    render(<ItemCreateModal isOpen={true} onClose={vi.fn()} onItemCreated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Nombre del insumo/i), { target: { value: 'Pimienta Negra' } });
    fireEvent.change(screen.getByLabelText(/Unidad/i), { target: { value: 'kg' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear Insumo/i }));

    await waitFor(() => {
      expect(screen.getByText(/Solo el due[ñn]o puede crear insumos/i)).toBeInTheDocument();
    });
  });

  it('submits form successfully and calls onItemCreated', async () => {
    vi.spyOn(inventoryClient, 'createItem').mockResolvedValue({
      ok: true,
      status: 201,
      data: { id: 77, name: 'Pimienta Negra' },
    });

    const handleCreated = vi.fn();
    render(<ItemCreateModal isOpen={true} onClose={vi.fn()} onItemCreated={handleCreated} />);

    fireEvent.change(screen.getByLabelText(/Nombre del insumo/i), { target: { value: 'Pimienta Negra' } });
    fireEvent.change(screen.getByLabelText(/Unidad/i), { target: { value: 'kg' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear Insumo/i }));

    await waitFor(() => {
      expect(handleCreated).toHaveBeenCalledTimes(1);
    });
  });
});
