import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ModuleGrid from '../ModuleGrid';
import { ABILITIES, ROLES } from '../../../services/permissions';

describe('ModuleGrid actividad y horas extra (Brief 46p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('un dueño (owner) ve "Actividad del equipo"', () => {
    const ownerUser = {
      id: 1,
      role: ROLES.OWNER,
      capabilities: {
        is_owner: true,
        role: ROLES.OWNER,
      },
    };

    render(<ModuleGrid user={ownerUser} onSelectModule={vi.fn()} />);
    expect(screen.getByText('Actividad del equipo')).toBeInTheDocument();
  });

  it('un usuario con audit.view ve la tarjeta "Actividad del equipo"', () => {
    const userWithAudit = {
      id: 5,
      capabilities: { abilities: [ABILITIES.AUDIT_VIEW] },
    };

    render(<ModuleGrid user={userWithAudit} onSelectModule={vi.fn()} />);
    expect(screen.getByText('Actividad del equipo')).toBeInTheDocument();
    expect(screen.getByText('Quién hizo cada cambio')).toBeInTheDocument();
  });

  it('un usuario sin audit.view no ve "Actividad del equipo"', () => {
    const staffUser = {
      id: 10,
      capabilities: {
        abilities: [
          ABILITIES.INVENTORY_VIEW,
          ABILITIES.SUPPLY_REQUEST,
          ABILITIES.WITHDRAWALS_DECLARE,
        ],
      },
    };

    render(<ModuleGrid user={staffUser} onSelectModule={vi.fn()} />);
    expect(screen.queryByText('Actividad del equipo')).toBeNull();
  });

  it('muestra el número de pendientes en la tarjeta de Horas extra para quien tenga overtime.approve', () => {
    const approver = {
      id: 2,
      capabilities: { abilities: [ABILITIES.OVERTIME_APPROVE] },
    };

    render(<ModuleGrid user={approver} onSelectModule={vi.fn()} badges={{ overtime: 5 }} />);
    expect(screen.getByText('Horas extra')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
