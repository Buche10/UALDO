import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SuggestionChips from '../SuggestionChips';
import { ABILITIES } from '../../../services/permissions';
import * as withdrawalsClient from '../../../services/withdrawalsClient';

describe('SuggestionChips (Brief 26p / 30p / 32p / 32p_fix / 35p / 36p / 37p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('el contenedor tiene role="toolbar" y la clase assistant-chips-container', () => {
    render(<SuggestionChips user={null} onSelectChip={vi.fn()} />);
    const toolbar = screen.getByRole('toolbar', { name: /sugerencias rápidas/i });
    expect(toolbar).toBeInTheDocument();
    expect(toolbar.className).toContain('assistant-chips-container');
  });

  it('un usuario con supply.decide ve las sugerencias de decisor', () => {
    const user = {
      id: 1,
      capabilities: { abilities: [ABILITIES.SUPPLY_DECIDE] },
    };
    render(<SuggestionChips user={user} onSelectChip={vi.fn()} />);

    expect(screen.getByRole('button', { name: /pedidos por aprobar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /qué hay que comprar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pedir insumos/i })).toBeInTheDocument();
  });

  it('un usuario sin supply.decide ve las sugerencias de personal operativo', () => {
    const user = {
      id: 2,
      capabilities: { abilities: [ABILITIES.SUPPLY_REQUEST] },
    };
    render(<SuggestionChips user={user} onSelectChip={vi.fn()} />);

    expect(screen.getByRole('button', { name: /reportar faltantes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mis pedidos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buscar un insumo/i })).toBeInTheDocument();
  });

  it('al pulsar un chip se invoca onSelectChip con el prompt correspondiente', () => {
    const onSelect = vi.fn();
    const user = {
      id: 1,
      capabilities: { abilities: [ABILITIES.SUPPLY_DECIDE] },
    };
    render(<SuggestionChips user={user} onSelectChip={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /pedidos por aprobar/i }));
    expect(onSelect).toHaveBeenCalledWith('¿Hay pedidos pendientes por aprobar?');
  });

  describe('accesos rápidos de retiros de bodega (Requerimiento 6 & Brief 32p_fix)', () => {
    it('con withdrawals.declare ve "Voy a la bodega" y envía "Voy a retirar de la bodega"', () => {
      const onSelect = vi.fn();
      const user = {
        id: 7,
        capabilities: { abilities: [ABILITIES.WITHDRAWALS_DECLARE] },
      };
      render(<SuggestionChips user={user} onSelectChip={onSelect} hasOpenWithdrawals={false} />);

      const chip = screen.getByRole('button', { name: /voy a la bodega/i });
      expect(chip).toBeInTheDocument();

      fireEvent.click(chip);
      expect(onSelect).toHaveBeenCalledWith('Voy a retirar de la bodega');
      expect(screen.queryByRole('button', { name: /cerrar mi retiro/i })).toBeNull();
    });

    it('con retiros abiertos ve además "Cerrar mi retiro"', () => {
      const onSelect = vi.fn();
      const user = {
        id: 7,
        capabilities: { abilities: [ABILITIES.WITHDRAWALS_DECLARE] },
      };
      render(<SuggestionChips user={user} onSelectChip={onSelect} hasOpenWithdrawals={true} />);

      const chipVoy = screen.getByRole('button', { name: /voy a la bodega/i });
      expect(chipVoy).toBeInTheDocument();

      const chipCerrar = screen.getByRole('button', { name: /cerrar mi retiro/i });
      expect(chipCerrar).toBeInTheDocument();

      fireEvent.click(chipCerrar);
      expect(onSelect).toHaveBeenCalledWith('Cerrar mi retiro');
    });

    it('solo muestra "Cerrar mi retiro" si el usuario actual tiene retiros pendientes propios (open o escalated)', async () => {
      vi.spyOn(withdrawalsClient, 'listWithdrawals').mockResolvedValue({
        ok: true,
        data: [
          { id: 1, user_id: 99, status: 'open' },
          { id: 2, user: { id: 88 }, status: 'escalated' },
        ],
      });

      const user = {
        id: 7,
        capabilities: { abilities: [ABILITIES.WITHDRAWALS_DECLARE] },
      };

      const { unmount } = render(<SuggestionChips user={user} onSelectChip={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /voy a la bodega/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /cerrar mi retiro/i })).not.toBeInTheDocument();
      });

      unmount();

      vi.spyOn(withdrawalsClient, 'listWithdrawals').mockResolvedValue({
        ok: true,
        data: [
          { id: 3, user: { id: 7 }, status: 'escalated' },
        ],
      });

      render(<SuggestionChips user={user} onSelectChip={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cerrar mi retiro/i })).toBeInTheDocument();
      });
    });
  });

  describe('accesos rápidos de horas extra (Brief 36p)', () => {
    it('con overtime.register.kitchen ve "Registrar horas extra" y envía "Quiero registrar horas extra"', () => {
      const onSelect = vi.fn();
      const user = {
        id: 10,
        capabilities: { abilities: [ABILITIES.OVERTIME_REGISTER_KITCHEN] },
      };
      render(<SuggestionChips user={user} onSelectChip={onSelect} />);

      const chip = screen.getByRole('button', { name: /registrar horas extra/i });
      expect(chip).toBeInTheDocument();

      fireEvent.click(chip);
      expect(onSelect).toHaveBeenCalledWith('Quiero registrar horas extra');
    });

    it('sin overtime.register.* no ve el chip de horas extra', () => {
      const user = {
        id: 11,
        capabilities: { abilities: [ABILITIES.INVENTORY_VIEW] },
      };
      render(<SuggestionChips user={user} onSelectChip={vi.fn()} />);

      expect(screen.queryByRole('button', { name: /registrar horas extra/i })).toBeNull();
    });
  });

  describe('accesos rápidos de cierre de caja (Brief 35p)', () => {
    it('para quien tiene cash.register sin cash.review ve "Hacer el cierre de caja" y envía el texto correspondiente', () => {
      const onSelect = vi.fn();
      const user = {
        id: 15,
        capabilities: { abilities: [ABILITIES.CASH_REGISTER] },
      };
      render(<SuggestionChips user={user} onSelectChip={onSelect} />);

      const chip = screen.getByRole('button', { name: /hacer el cierre de caja/i });
      expect(chip).toBeInTheDocument();

      fireEvent.click(chip);
      expect(onSelect).toHaveBeenCalledWith('Quiero declarar el cierre de caja de hoy');
    });

    it('para quien tiene cash.review no muestra el chip de declaración del jefe', () => {
      const user = {
        id: 1,
        capabilities: { abilities: [ABILITIES.CASH_REGISTER, ABILITIES.CASH_REVIEW] },
      };
      render(<SuggestionChips user={user} onSelectChip={vi.fn()} />);

      expect(screen.queryByRole('button', { name: /hacer el cierre de caja/i })).toBeNull();
    });

    it('para personal sin cash.register no muestra el chip de cierre', () => {
      const user = {
        id: 20,
        capabilities: { abilities: [ABILITIES.SUPPLY_REQUEST] },
      };
      render(<SuggestionChips user={user} onSelectChip={vi.fn()} />);

      expect(screen.queryByRole('button', { name: /hacer el cierre de caja/i })).toBeNull();
    });
  });

  describe('accesos rápidos de reservas (Brief 39p)', () => {
    it('con reservations.view ve "Reservas de hoy" y envía la pregunta', () => {
      const onSelect = vi.fn();
      const user = {
        id: 30,
        capabilities: { abilities: [ABILITIES.RESERVATIONS_VIEW] },
      };
      render(<SuggestionChips user={user} onSelectChip={onSelect} />);

      const chip = screen.getByRole('button', { name: /reservas de hoy/i });
      expect(chip).toBeInTheDocument();
      fireEvent.click(chip);
      expect(onSelect).toHaveBeenCalledWith('¿Qué reservas hay hoy?');
    });

    it('sin reservations.view no muestra el acceso', () => {
      const user = { id: 31, capabilities: { abilities: [ABILITIES.INVENTORY_VIEW] } };
      render(<SuggestionChips user={user} onSelectChip={vi.fn()} />);
      expect(screen.queryByRole('button', { name: /reservas de hoy/i })).not.toBeInTheDocument();
    });
  });

  describe('accesos rápidos de incidencias (Brief 37p)', () => {
    it('muestra "Reportar un problema" para todos y envía "Quiero reportar un problema"', () => {
      const onSelect = vi.fn();
      render(<SuggestionChips user={null} onSelectChip={onSelect} />);

      const chip = screen.getByRole('button', { name: /reportar un problema/i });
      expect(chip).toBeInTheDocument();

      fireEvent.click(chip);
      expect(onSelect).toHaveBeenCalledWith('Quiero reportar un problema');
    });
  });
});
