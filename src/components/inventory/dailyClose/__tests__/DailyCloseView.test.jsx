import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DailyCloseView from '../DailyCloseView';
import { getTodayStr } from '../dailyCloseDates';
import * as auth from '../../../../services/auth';
import * as countsClient from '../../../../services/inventoryCountsClient';
import { ABILITIES } from '../../../../services/permissions';

// Mock de CountSheet para probar la navegación sin acoplar la planilla completa
vi.mock('../../counts/CountSheet', () => ({
  default: ({ countId, isDailyClose, backLabel, onBack, onSubmitSuccess }) => (
    <div data-testid="mock-count-sheet">
      <span>Planilla conteo #{countId}</span>
      <span>{backLabel || 'Volver al cierre'}</span>
      <button type="button" onClick={onBack}>
        Volver
      </button>
      <button
        type="button"
        onClick={() => onSubmitSuccess({ id: countId, status: 'submitted', lines: [] })}
      >
        Simular envío con diferencias
      </button>
      <button
        type="button"
        onClick={() => onSubmitSuccess({ id: countId, status: 'validated', lines: [] })}
      >
        Simular autovalidación
      </button>
    </div>
  ),
}));

describe('DailyCloseView component (Brief 31p / 31p_fix)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseSummary = {
    date: '2026-11-01',
    locations: [
      {
        location: 'kitchen',
        location_label: 'Cocina',
        count_id: null,
        status: 'pending',
        differences_count: 0,
        unexplained_count: 0,
      },
    ],
  };

  it('un kitchen_head ve solo cocina y puede empezar conteo exitoso', async () => {
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
      data: baseSummary,
    });

    const createSpy = vi.spyOn(countsClient, 'createDailyClose').mockResolvedValue({
      ok: true,
      data: { data: { id: 25, status: 'draft' } },
    });

    render(<DailyCloseView user={kitchenUser} />);

    expect(await screen.findByText('Cocina')).toBeInTheDocument();
    expect(screen.queryByText('Salón')).not.toBeInTheDocument();

    const startBtn = screen.getByRole('button', { name: /Empezar conteo/i });
    fireEvent.click(startBtn);

    expect(await screen.findByTestId('mock-count-sheet')).toBeInTheDocument();
    expect(screen.getByText('Planilla conteo #25')).toBeInTheDocument();
    expect(createSpy).toHaveBeenCalledWith('kitchen', getTodayStr());
  });

  it('al empezar conteo maneja 409 con existing_count_id abriendo el conteo existente', async () => {
    const kitchenUser = {
      id: 5,
      name: 'Mario',
      capabilities: { abilities: [ABILITIES.INVENTORY_COUNT_KITCHEN] },
    };
    vi.spyOn(auth, 'getUser').mockReturnValue(kitchenUser);
    vi.spyOn(countsClient, 'getDailyCloseSummary').mockResolvedValue({
      ok: true,
      data: baseSummary,
    });

    vi.spyOn(countsClient, 'createDailyClose').mockResolvedValue({
      ok: false,
      status: 409,
      data: { existing_count_id: 33 },
    });

    render(<DailyCloseView user={kitchenUser} />);
    expect(await screen.findByText('Cocina')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Empezar conteo/i }));

    expect(await screen.findByTestId('mock-count-sheet')).toBeInTheDocument();
    expect(screen.getByText('Planilla conteo #33')).toBeInTheDocument();
  });

  it('al enviar conteo con diferencias pasa a DifferencesList, y autovalidado vuelve al resumen', async () => {
    const kitchenUser = {
      id: 5,
      capabilities: { abilities: [ABILITIES.INVENTORY_COUNT_KITCHEN] },
    };
    vi.spyOn(auth, 'getUser').mockReturnValue(kitchenUser);
    vi.spyOn(countsClient, 'getDailyCloseSummary').mockResolvedValue({
      ok: true,
      data: {
        date: '2026-11-01',
        locations: [{ ...baseSummary.locations[0], count_id: 40, status: 'draft' }],
      },
    });

    render(<DailyCloseView user={kitchenUser} />);
    expect(await screen.findByRole('button', { name: /Continuar conteo/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Continuar conteo/i }));
    expect(await screen.findByTestId('mock-count-sheet')).toBeInTheDocument();

    // 1. Simular autovalidación -> vuelve al resumen
    fireEvent.click(screen.getByRole('button', { name: /Simular autovalidación/i }));
    expect(await screen.findByText('Cocina')).toBeInTheDocument();

    // 2. Abrir de nuevo y simular envío con diferencias -> abre DifferencesList
    fireEvent.click(screen.getByRole('button', { name: /Continuar conteo/i }));
    fireEvent.click(screen.getByRole('button', { name: /Simular envío con diferencias/i }));
    expect(await screen.findByText(/Una diferencia no es una falta/i)).toBeInTheDocument();
  });

  it('muestra mensaje de error con botón Reintentar cuando falla loadSummary', async () => {
    const user = { id: 1, capabilities: { abilities: [] } };
    vi.spyOn(auth, 'getUser').mockReturnValue(user);

    const summarySpy = vi.spyOn(countsClient, 'getDailyCloseSummary').mockResolvedValueOnce({
      ok: false,
      error: 'Fallo de red',
    }).mockResolvedValueOnce({
      ok: true,
      data: { date: '2026-11-01', locations: [] },
    });

    render(<DailyCloseView user={user} />);

    expect(await screen.findByText('Fallo de red')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /Reintentar/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(summarySpy).toHaveBeenCalledTimes(2);
    });
  });

  it('permite alternar entre hoy y ayer recargando el resumen', async () => {
    const user = { id: 1, capabilities: { abilities: [] } };
    vi.spyOn(auth, 'getUser').mockReturnValue(user);

    const summarySpy = vi.spyOn(countsClient, 'getDailyCloseSummary').mockResolvedValue({
      ok: true,
      data: { date: '2026-11-01', locations: [] },
    });

    render(<DailyCloseView user={user} />);
    expect(await screen.findByText('Hoy')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ayer' }));

    await waitFor(() => {
      expect(summarySpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cierres escalados y validación por rol (Requerimientos 1 y 2)', () => {
    it('escalado sin enviar: con inventory.adjust ve Completar conteo y abre la planilla', async () => {
      const adminUser = {
        id: 2,
        capabilities: { abilities: [ABILITIES.INVENTORY_ADJUST] },
      };
      vi.spyOn(auth, 'getUser').mockReturnValue(adminUser);
      vi.spyOn(countsClient, 'getDailyCloseSummary').mockResolvedValue({
        ok: true,
        data: {
          date: '2026-11-01',
          locations: [
            {
              location: 'kitchen',
              location_label: 'Cocina',
              count_id: 55,
              status: 'escalated',
              submitted_at: null,
              differences_count: 0,
            },
          ],
        },
      });

      render(<DailyCloseView user={adminUser} />);

      expect(await screen.findByText('Cocina')).toBeInTheDocument();
      const completeBtn = screen.getByRole('button', { name: /Completar conteo/i });
      fireEvent.click(completeBtn);

      expect(await screen.findByTestId('mock-count-sheet')).toBeInTheDocument();
      expect(screen.getByText('Planilla conteo #55')).toBeInTheDocument();
    });

    it('escalado sin enviar: sin inventory.adjust ve etiqueta Escalado a administración sin acciones', async () => {
      const kitchenStaff = {
        id: 3,
        capabilities: { abilities: [ABILITIES.INVENTORY_COUNT_KITCHEN] },
      };
      vi.spyOn(auth, 'getUser').mockReturnValue(kitchenStaff);
      vi.spyOn(countsClient, 'getDailyCloseSummary').mockResolvedValue({
        ok: true,
        data: {
          date: '2026-11-01',
          locations: [
            {
              location: 'kitchen',
              location_label: 'Cocina',
              count_id: 55,
              status: 'escalated',
              submitted_at: null,
              differences_count: 0,
            },
          ],
        },
      });

      render(<DailyCloseView user={kitchenStaff} />);

      expect(await screen.findByText('Escalado a administración')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Completar conteo/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Ver diferencias/i })).toBeNull();
    });

    it('escalado y enviado: el jefe de cocina no ve Validar, administración sí', async () => {
      const kitchenHead = {
        id: 4,
        capabilities: { abilities: [ABILITIES.INVENTORY_VALIDATE_KITCHEN] },
      };
      vi.spyOn(auth, 'getUser').mockReturnValue(kitchenHead);

      const countDetail = {
        id: 60,
        location: 'kitchen',
        status: 'escalated',
        submitted_at: '2026-11-01T12:00:00Z',
        lines: [
          { item_id: 1, item_name: 'Bife', difference: -1, counted_quantity: 4, system_quantity: 5, explanation_cause: 'merma_no_registrada', explanation: '' },
        ],
      };

      vi.spyOn(countsClient, 'getDailyCloseSummary').mockResolvedValue({
        ok: true,
        data: {
          date: '2026-11-01',
          locations: [
            {
              location: 'kitchen',
              location_label: 'Cocina',
              count_id: 60,
              status: 'escalated',
              submitted_at: '2026-11-01T12:00:00Z',
              differences_count: 1,
            },
          ],
        },
      });

      vi.spyOn(countsClient, 'getCount').mockResolvedValue({
        ok: true,
        data: { data: countDetail },
      });

      // 1. Jefe de cocina abre diferencias
      const { unmount } = render(<DailyCloseView user={kitchenHead} />);
      const diffBtn = await screen.findByRole('button', { name: /Ver diferencias/i });
      fireEvent.click(diffBtn);

      expect(await screen.findByText(/Una diferencia no es una falta/i)).toBeInTheDocument();
      // NO debe ver el botón de Validar (requiere inventory.adjust por estar escalado)
      expect(screen.queryByRole('button', { name: /^Validar$/i })).toBeNull();

      unmount();

      // 2. Administración con inventory.adjust
      const adminUser = {
        id: 2,
        capabilities: { abilities: [ABILITIES.INVENTORY_ADJUST] },
      };
      vi.spyOn(auth, 'getUser').mockReturnValue(adminUser);

      render(<DailyCloseView user={adminUser} />);
      const reviewBtn = await screen.findByRole('button', { name: /Revisar diferencias/i });
      fireEvent.click(reviewBtn);

      expect(await screen.findByText(/Una diferencia no es una falta/i)).toBeInTheDocument();
      // SÍ debe ver el botón de Validar
      expect(screen.getByRole('button', { name: /^Validar$/i })).toBeInTheDocument();
    });
  });

  describe('Volver tras corregir conteo (Requerimiento 5)', () => {
    it('tras Corregir conteo, volver en CountSheet recarga el detalle con getCount y vuelve a diferencias', async () => {
      const adminUser = {
        id: 2,
        capabilities: { abilities: [ABILITIES.INVENTORY_ADJUST] },
      };
      vi.spyOn(auth, 'getUser').mockReturnValue(adminUser);

      const countDetail = {
        id: 70,
        location: 'kitchen',
        status: 'submitted',
        lines: [
          { item_id: 1, item_name: 'Bife', difference: -2, counted_quantity: 3, system_quantity: 5, explanation_cause: 'error_de_conteo', explanation: '' },
        ],
      };

      vi.spyOn(countsClient, 'getDailyCloseSummary').mockResolvedValue({
        ok: true,
        data: {
          date: '2026-11-01',
          locations: [
            { location: 'kitchen', location_label: 'Cocina', count_id: 70, status: 'submitted', differences_count: 1 },
          ],
        },
      });

      const getCountSpy = vi.spyOn(countsClient, 'getCount').mockResolvedValue({
        ok: true,
        data: { data: countDetail },
      });

      render(<DailyCloseView user={adminUser} />);
      const revBtn = await screen.findByRole('button', { name: /Revisar diferencias/i });
      fireEvent.click(revBtn);

      expect(await screen.findByText('Corregir conteo')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Corregir conteo/i }));

      // Ahora estamos en la planilla simulada con origen 'differences'
      expect(await screen.findByTestId('mock-count-sheet')).toBeInTheDocument();
      expect(screen.getByText('Volver a diferencias')).toBeInTheDocument();

      // Al hacer clic en Volver dentro de CountSheet
      fireEvent.click(screen.getByRole('button', { name: 'Volver' }));

      // Debe recargar con getCount y volver a DifferencesList
      await waitFor(() => {
        expect(getCountSpy).toHaveBeenCalledTimes(2);
      });
      expect(screen.getByText(/Una diferencia no es una falta/i)).toBeInTheDocument();
    });
  });
});
