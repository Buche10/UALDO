import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import OvertimeView from '../OvertimeView';
import { ABILITIES } from '../../../services/permissions';
import * as overtimeClient from '../../../services/overtimeClient';

describe('OvertimeView (Brief 36p)', () => {
  const kitchenHead = {
    id: 10,
    role: 'kitchen_head',
    capabilities: {
      role: 'kitchen_head',
      area: 'kitchen',
      abilities: [ABILITIES.OVERTIME_REGISTER_KITCHEN],
    },
  };

  const adminUser = {
    id: 1,
    role: 'admin',
    capabilities: {
      role: 'admin',
      abilities: [ABILITIES.OVERTIME_REGISTER_KITCHEN, ABILITIES.OVERTIME_REGISTER_LOUNGE, ABILITIES.OVERTIME_REPORT],
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(overtimeClient, 'listOvertimeWorkers').mockResolvedValue({ ok: true, data: [] });
    vi.spyOn(overtimeClient, 'listOvertime').mockResolvedValue({ ok: true, data: { data: [], meta: {} } });
    vi.spyOn(overtimeClient, 'getOvertimeSummary').mockResolvedValue({ ok: true, data: { month: '2026-10', total_hours: 0, people: 0, workers: [] } });
  });

  it('un jefe de cocina ve pestañas "Registrar" y "Registros", pero no ve "Mes"', async () => {
    render(<OvertimeView user={kitchenHead} />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /registrar/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('tab', { name: /registros/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /mes/i })).toBeNull();
  });

  it('administración ve las tres pestañas ("Registrar", "Registros", "Mes")', async () => {
    render(<OvertimeView user={adminUser} />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /registrar/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('tab', { name: /registros/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /mes/i })).toBeInTheDocument();
  });

  it('abre directamente en "Mes" si se pasa initialMonth y tiene overtime.report', async () => {
    render(<OvertimeView user={adminUser} initialMonth="2026-10" />);

    const mesTab = await screen.findByRole('tab', { name: /mes/i });
    expect(mesTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText(/mes a consultar/i)).toBeInTheDocument();
  });

  it('RESTRICCIÓN ESTRICTA: no renderiza ningún símbolo "$" ni dinero en la interfaz', async () => {
    const { container } = render(<OvertimeView user={adminUser} initialMonth="2026-10" />);

    await screen.findByRole('tab', { name: /mes/i });

    const textContent = container.textContent || '';
    expect(textContent).not.toContain('$');
    expect(textContent.toLowerCase()).not.toContain('usd');
    expect(textContent.toLowerCase()).not.toContain('sueldo');
    expect(textContent.toLowerCase()).not.toContain('salario');
    expect(textContent.toLowerCase()).not.toContain('nómina');
  });
});
