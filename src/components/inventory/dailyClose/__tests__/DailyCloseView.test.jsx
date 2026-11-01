import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DailyCloseView from '../DailyCloseView';
import * as auth from '../../../../services/auth';
import * as countsClient from '../../../../services/inventoryCountsClient';
import { ABILITIES } from '../../../../services/permissions';

describe('DailyCloseView component (Brief 31p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('un kitchen_head ve solo cocina y puede empezar conteo', async () => {
    const kitchenUser = {
      id: 5,
      name: 'Mario Cocinero',
      role: 'kitchen_head',
      capabilities: {
        abilities: [ABILITIES.INVENTORY_COUNT_KITCHEN, ABILITIES.INVENTORY_VALIDATE_KITCHEN],
      },
    };
    vi.spyOn(auth, 'getUser').mockReturnValue(kitchenUser);

    vi.spyOn(countsClient, 'getDailyCloseSummary').mockResolvedValue({
      ok: true,
      data: {
        date: '2026-11-01',
        locations: [
          {
            location: 'kitchen',
            location_label: 'Cocina',
            count_id: null,
            status: 'pending',
            counted_by: null,
            validated_by: null,
            self_validated: false,
            differences_count: 0,
            unexplained_count: 0,
          },
        ],
      },
    });

    render(<DailyCloseView user={kitchenUser} />);

    expect(await screen.findByText('Cocina')).toBeInTheDocument();
    expect(screen.queryByText('Salón')).not.toBeInTheDocument();
    expect(screen.getByText('Sin empezar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Empezar conteo/i })).toBeInTheDocument();
  });

  it('un lounge_staff ve salón sin botón de validar y puede continuar conteo en borrador', async () => {
    const loungeStaffUser = {
      id: 6,
      name: 'Carlos Garzón',
      role: 'lounge_staff',
      capabilities: {
        abilities: [ABILITIES.INVENTORY_COUNT_LOUNGE],
      },
    };
    vi.spyOn(auth, 'getUser').mockReturnValue(loungeStaffUser);

    vi.spyOn(countsClient, 'getDailyCloseSummary').mockResolvedValue({
      ok: true,
      data: {
        date: '2026-11-01',
        locations: [
          {
            location: 'lounge',
            location_label: 'Salón',
            count_id: 12,
            status: 'draft',
            counted_by: 'Carlos',
            validated_by: null,
            self_validated: false,
            differences_count: 0,
            unexplained_count: 0,
          },
        ],
      },
    });

    render(<DailyCloseView user={loungeStaffUser} />);

    expect(await screen.findByText('Salón')).toBeInTheDocument();
    expect(screen.getByText('Contando')).toBeInTheDocument();
    expect(screen.getByText('Carlos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar conteo/i })).toBeInTheDocument();
  });

  it('el dueño ve todas las áreas con valor de diferencias y etiqueta de autovalidado', async () => {
    const ownerUser = {
      id: 1,
      name: 'Ualdo Dueño',
      role: 'owner',
      capabilities: {
        abilities: [
          ABILITIES.INVENTORY_COUNT_KITCHEN,
          ABILITIES.INVENTORY_COUNT_LOUNGE,
          ABILITIES.INVENTORY_VALIDATE_KITCHEN,
          ABILITIES.INVENTORY_VALIDATE_LOUNGE,
          ABILITIES.INVENTORY_COSTS,
          ABILITIES.INVENTORY_ADJUST,
        ],
      },
    };
    vi.spyOn(auth, 'getUser').mockReturnValue(ownerUser);

    vi.spyOn(countsClient, 'getDailyCloseSummary').mockResolvedValue({
      ok: true,
      data: {
        date: '2026-11-01',
        locations: [
          {
            location: 'kitchen',
            location_label: 'Cocina',
            count_id: 14,
            status: 'validated',
            counted_by: 'Manuel',
            validated_by: 'Manuel',
            self_validated: true,
            differences_count: 1,
            unexplained_count: 0,
            difference_value_cents: -1250,
          },
          {
            location: 'lounge',
            location_label: 'Salón',
            count_id: 15,
            status: 'submitted',
            counted_by: 'Lucía',
            validated_by: null,
            self_validated: false,
            differences_count: 2,
            unexplained_count: 2,
            difference_value_cents: 800,
          },
        ],
      },
    });

    render(<DailyCloseView user={ownerUser} />);

    expect(await screen.findByText('Cocina')).toBeInTheDocument();
    expect(screen.getByText('Salón')).toBeInTheDocument();
    expect(screen.getByText('Validado por quien contó')).toBeInTheDocument();
    expect(screen.getByText('USD -12,50')).toBeInTheDocument();
    expect(screen.getByText('USD 8,00')).toBeInTheDocument();
  });

  it('permite alternar entre hoy y ayer recargando el resumen', async () => {
    const ownerUser = { id: 1, role: 'owner', capabilities: { abilities: [] } };
    vi.spyOn(auth, 'getUser').mockReturnValue(ownerUser);

    const summarySpy = vi.spyOn(countsClient, 'getDailyCloseSummary').mockResolvedValue({
      ok: true,
      data: { date: '2026-11-01', locations: [] },
    });

    render(<DailyCloseView user={ownerUser} />);
    expect(await screen.findByText('Hoy')).toBeInTheDocument();

    const yesterdayBtn = screen.getByRole('button', { name: 'Ayer' });
    fireEvent.click(yesterdayBtn);

    await waitFor(() => {
      expect(summarySpy).toHaveBeenCalledTimes(2);
    });
  });
});
