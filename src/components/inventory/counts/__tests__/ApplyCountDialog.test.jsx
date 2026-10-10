import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ApplyCountDialog from '../ApplyCountDialog';
import * as inventoryCountsClient from '../../../../services/inventoryCountsClient';

describe('ApplyCountDialog component', () => {
  const mockCountDetail = {
    id: 20,
    location: 'warehouse',
    location_label: 'Bodega',
    status: 'draft',
  };

  const mockItems = [
    { id: 1, name: 'Harina de trigo', unit: 'kg' },
    { id: 2, name: 'Azúcar morena', unit: 'kg' },
    { id: 3, name: 'Sal marina', unit: 'kg' },
  ];

  const mockQuantities = {
    1: { counted_quantity: '10' },
    2: { counted_quantity: '5' },
    3: { counted_quantity: '' },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ApplyCountDialog
        isOpen={false}
        countId={20}
        countDetail={mockCountDetail}
        items={mockItems}
        quantities={mockQuantities}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders confirmation view with counted and uncounted tallies and warning note', () => {
    render(
      <ApplyCountDialog
        isOpen={true}
        countId={20}
        countDetail={mockCountDetail}
        items={mockItems}
        quantities={mockQuantities}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Confirmar y Aplicar Conteo')).toBeInTheDocument();
    expect(screen.getByText('Bodega')).toBeInTheDocument();
    expect(screen.getByText('Insumos contados:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/El conteo es absoluto/)).toBeInTheDocument();
  });

  it('counts what is saved in the engine: a cleared saved line is counted, an invalid pending one is not', () => {
    render(
      <ApplyCountDialog
        isOpen={true}
        countId={20}
        countDetail={mockCountDetail}
        items={mockItems}
        quantities={{
          1: { counted_quantity: '', initial_saved_qty: '7' },
          2: { counted_quantity: '1.2345', initial_saved_qty: '' },
          3: { counted_quantity: '', initial_saved_qty: '2' },
        }}
        onClose={vi.fn()}
      />
    );

    // Contados: 1 y 3 (guardados aunque el campo esté en blanco). No contado: 2 (inválido, no se guardará).
    expect(screen.getByText('Insumos contados:').nextSibling).toHaveTextContent('2');
    expect(screen.getByText('No contados (se conservan):').nextSibling).toHaveTextContent('1');
  });

  it('applies count and renders diffs from backend response, sorted by absolute diff with nulls last', async () => {
    const savePendingLines = vi.fn().mockResolvedValue(true);
    const onAppliedComplete = vi.fn();

    vi.spyOn(inventoryCountsClient, 'applyCount').mockResolvedValue({
      ok: true,
      data: { status: 'applied' },
    });

    // Notice line 1: system=8, counted=10 (subtraction would be 2), but backend returns difference=99!
    // This strictly fails if the client calculates difference as (counted - system).
    // Also line 3 has difference: null, which must be placed at the end.
    const appliedDetailWithDiffs = {
      id: 20,
      location: 'warehouse',
      status: 'applied',
      lines: [
        {
          id: 101,
          item_id: 1,
          item_name: 'Harina de trigo',
          unit: 'kg',
          system_quantity: 8,
          counted_quantity: 10,
          difference: 99, // Intentional mismatch with counted - system
        },
        {
          id: 102,
          item_id: 2,
          item_name: 'Azúcar morena',
          unit: 'kg',
          system_quantity: 10,
          counted_quantity: 5,
          difference: -5,
        },
        {
          id: 103,
          item_id: 3,
          item_name: 'Sal marina',
          unit: 'kg',
          system_quantity: null,
          counted_quantity: null,
          difference: null,
        },
      ],
    };

    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: { data: appliedDetailWithDiffs },
    });

    render(
      <ApplyCountDialog
        isOpen={true}
        countId={20}
        countDetail={mockCountDetail}
        items={mockItems}
        quantities={mockQuantities}
        savePendingLines={savePendingLines}
        onClose={vi.fn()}
        onAppliedComplete={onAppliedComplete}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Confirmar y Aplicar/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('Resultado del Conteo Aplicado')).toBeInTheDocument();
      expect(screen.getByText('Conteo aplicado exitosamente en el motor.')).toBeInTheDocument();
      expect(screen.getByText('+99')).toBeInTheDocument();
      expect(screen.getByText('-5')).toBeInTheDocument();
      expect(screen.getByText('Sin dato')).toBeInTheDocument();
    });

    // Check order: +99 (abs 99), then -5 (abs 5), then null
    const lineNames = screen.getAllByText(/Harina de trigo|Azúcar morena|Sal marina/).map((el) => el.textContent);
    expect(lineNames).toEqual(['Harina de trigo', 'Azúcar morena', 'Sal marina']);

    expect(savePendingLines).toHaveBeenCalled();
    expect(onAppliedComplete).toHaveBeenCalledWith(appliedDetailWithDiffs);
  });

  it('renders XSS item name as plain text without any img tag in DOM', async () => {
    const xssPayload = '<img src=x onerror=alert(1)>';
    vi.spyOn(inventoryCountsClient, 'applyCount').mockResolvedValue({
      ok: true,
      data: { status: 'applied' },
    });

    vi.spyOn(inventoryCountsClient, 'getCount').mockResolvedValue({
      ok: true,
      data: {
        data: {
          id: 20,
          status: 'applied',
          lines: [
            {
              id: 1,
              item_id: 1,
              item_name: xssPayload,
              unit: 'kg',
              system_quantity: 1,
              counted_quantity: 2,
              difference: 1,
            },
          ],
        },
      },
    });

    const { container } = render(
      <ApplyCountDialog
        isOpen={true}
        countId={20}
        countDetail={mockCountDetail}
        items={mockItems}
        quantities={mockQuantities}
        onClose={vi.fn()}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Confirmar y Aplicar/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(xssPayload)).toBeInTheDocument();
    });

    expect(container.querySelector('img')).toBeNull();
  });

  it('closes dialog on close button click and on Escape key press', () => {
    const onClose = vi.fn();
    render(
      <ApplyCountDialog
        isOpen={true}
        countId={20}
        countDetail={mockCountDetail}
        items={mockItems}
        quantities={mockQuantities}
        onClose={onClose}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByLabelText('Cerrar diálogo');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('renders error message when apply fails', async () => {
    vi.spyOn(inventoryCountsClient, 'applyCount').mockResolvedValue({
      ok: false,
      status: 409,
      data: { message: 'El conteo ya fue aplicado previamente' },
    });

    render(
      <ApplyCountDialog
        isOpen={true}
        countId={20}
        countDetail={mockCountDetail}
        items={mockItems}
        quantities={mockQuantities}
        savePendingLines={vi.fn().mockResolvedValue(true)}
        onClose={vi.fn()}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Confirmar y Aplicar/i });
    fireEvent.click(confirmBtn);

    expect(await screen.findByText('El conteo ya fue aplicado previamente')).toBeInTheDocument();
  });
});
