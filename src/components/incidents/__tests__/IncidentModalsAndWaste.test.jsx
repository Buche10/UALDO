import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IncidentWasteModal from '../IncidentWasteModal';
import IncidentSettingsModal from '../IncidentSettingsModal';
import { ResolveModal, DiscardModal } from '../IncidentActionModals';
import { formatTimeAgo, getStatusStyle } from '../incidentUi';
import * as inventoryClient from '../../../services/inventoryClient';
import * as incidentsClient from '../../../services/incidentsClient';

vi.mock('../../../services/inventoryClient', () => ({
  listInventory: vi.fn(),
}));

vi.mock('../../../services/incidentsClient', () => ({
  registerIncidentWaste: vi.fn(),
  getIncidentSettings: vi.fn(),
  updateIncidentSettings: vi.fn(),
  INCIDENT_CAUSES: ['produccion', 'servicio', 'cliente', 'desconocida'],
  INCIDENT_CAUSE_LABELS: {
    produccion: 'Falla en cocina / producción',
    servicio: 'Falla en servicio / salón',
    cliente: 'Preferencia del cliente',
    desconocida: 'No determinada',
  },
}));

describe('incidentUi helper functions', () => {
  it('formatTimeAgo handles all time delta ranges', () => {
    expect(formatTimeAgo(null)).toBe('');
    expect(formatTimeAgo('')).toBe('');

    const now = Date.now();
    expect(formatTimeAgo(new Date(now + 10000).toISOString())).toBe('recién');
    expect(formatTimeAgo(new Date(now - 10000).toISOString())).toBe('hace un momento');
    expect(formatTimeAgo(new Date(now - 5 * 60 * 1000).toISOString())).toBe('hace 5 min');
    expect(formatTimeAgo(new Date(now - 3 * 3600 * 1000).toISOString())).toBe('hace 3 h');
    expect(formatTimeAgo(new Date(now - 25 * 3600 * 1000).toISOString())).toBe('hace 1 día');
    expect(formatTimeAgo(new Date(now - 4 * 86400 * 1000).toISOString())).toBe('hace 4 días');
    expect(formatTimeAgo(new Date(now - 40 * 86400 * 1000).toISOString())).toMatch(/\d/);
  });

  it('getStatusStyle handles all statuses and default', () => {
    expect(getStatusStyle('abierta').text).toBe('var(--warning)');
    expect(getStatusStyle('en_atencion').text).toBe('var(--accent)');
    expect(getStatusStyle('resuelta').text).toBe('var(--success)');
    expect(getStatusStyle('validada').text).toBe('var(--text-main)');
    expect(getStatusStyle('descartada').text).toBe('var(--error)');
    expect(getStatusStyle('otro').text).toBe('var(--text-muted)');
  });
});

describe('IncidentWasteModal', () => {
  const mockItems = [
    { id: 10, name: 'Bife Ancho', unit: 'kg' },
    { id: 11, name: 'Papas fritas', unit: 'kg' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    inventoryClient.listInventory.mockResolvedValue({
      ok: true,
      data: mockItems,
    });
  });

  it('renders nothing when not open', () => {
    const { container } = render(<IncidentWasteModal isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('loads inventory items and submits waste registration', async () => {
    incidentsClient.registerIncidentWaste.mockResolvedValueOnce({
      ok: true,
      data: { id: 1, waste_registered: true },
    });
    const onWasteRegistered = vi.fn();
    const onClose = vi.fn();

    render(
      <IncidentWasteModal
        incidentId={1}
        isOpen
        onClose={onClose}
        onWasteRegistered={onWasteRegistered}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Bife Ancho (kg)')).toBeInTheDocument();
    });

    const qtyInput = screen.getByLabelText('Cantidad mermada');
    fireEvent.change(qtyInput, { target: { value: '0.450' } });

    fireEvent.click(screen.getByText('Confirmar merma'));

    await waitFor(() => {
      expect(incidentsClient.registerIncidentWaste).toHaveBeenCalledWith(
        1,
        [{ item_id: 10, quantity: '0.45' }],
        'kitchen'
      );
      expect(onWasteRegistered).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows error if quantity is 0 or invalid', async () => {
    render(<IncidentWasteModal incidentId={1} isOpen />);

    await waitFor(() => {
      expect(screen.getByText('Bife Ancho (kg)')).toBeInTheDocument();
    });

    const qtyInput = screen.getByLabelText('Cantidad mermada');
    fireEvent.change(qtyInput, { target: { value: '0' } });

    const form = qtyInput.closest('form');
    fireEvent.submit(form);

    expect(screen.getByText('La cantidad debe ser mayor a 0.')).toBeInTheDocument();
    expect(incidentsClient.registerIncidentWaste).not.toHaveBeenCalled();
  });
});

describe('IncidentSettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    incidentsClient.getIncidentSettings.mockResolvedValue({
      ok: true,
      data: { averia_reminder_hours: 24, averia_escalation_hours: 72 },
    });
  });

  it('renders nothing when not open', () => {
    const { container } = render(<IncidentSettingsModal isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('loads settings and saves updated hours', async () => {
    incidentsClient.updateIncidentSettings.mockResolvedValueOnce({
      ok: true,
      data: { averia_reminder_hours: 12, averia_escalation_hours: 48 },
    });
    const onClose = vi.fn();

    render(<IncidentSettingsModal isOpen onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Horas para recordar avería/i)).toHaveValue(24);
    });

    const remInput = screen.getByLabelText(/Horas para recordar avería/i);
    const escInput = screen.getByLabelText(/Horas para escalar avería/i);

    fireEvent.change(remInput, { target: { value: '12' } });
    fireEvent.change(escInput, { target: { value: '48' } });

    fireEvent.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(incidentsClient.updateIncidentSettings).toHaveBeenCalledWith({
        averia_reminder_hours: 12,
        averia_escalation_hours: 48,
      });
      expect(screen.getByText('Ajustes guardados correctamente.')).toBeInTheDocument();
    });
  });

  it('validates that escalation is greater than reminder', async () => {
    render(<IncidentSettingsModal isOpen />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Horas para recordar avería/i)).toHaveValue(24);
    });

    const escInput = screen.getByLabelText(/Horas para escalar avería/i);
    fireEvent.change(escInput, { target: { value: '20' } });

    fireEvent.click(screen.getByText('Guardar'));

    expect(
      screen.getByText('El escalamiento a administración debe ser mayor que el recordatorio.')
    ).toBeInTheDocument();
    expect(incidentsClient.updateIncidentSettings).not.toHaveBeenCalled();
  });
});

describe('IncidentActionModals validations', () => {
  it('ResolveModal rejects resolution with less than 5 chars', () => {
    const onConfirm = vi.fn();
    render(<ResolveModal isOpen isComplaint={false} onConfirm={onConfirm} />);

    const textarea = screen.getByLabelText(/Resolución aplicada/i);
    fireEvent.change(textarea, { target: { value: 'abc' } });

    // Since button is disabled for < 5 chars, trigger form submit directly
    const form = textarea.closest('form');
    fireEvent.submit(form);

    expect(screen.getByText('La resolución debe tener al menos 5 caracteres.')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('DiscardModal rejects reason with less than 5 chars', () => {
    const onConfirm = vi.fn();
    render(<DiscardModal isOpen onConfirm={onConfirm} />);

    const textarea = screen.getByLabelText(/Motivo del descarte/i);
    fireEvent.change(textarea, { target: { value: 'no' } });

    const form = textarea.closest('form');
    fireEvent.submit(form);

    expect(screen.getByText('El motivo debe tener al menos 5 caracteres.')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
