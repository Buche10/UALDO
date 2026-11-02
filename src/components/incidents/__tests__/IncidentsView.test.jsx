import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IncidentsView from '../IncidentsView';
import * as incidentsClient from '../../../services/incidentsClient';

vi.mock('../../../services/incidentsClient', () => ({
  listIncidents: vi.fn(),
  getIncident: vi.fn(),
  getIncidentRecurrence: vi.fn(),
  getIncidentSettings: vi.fn(),
  updateIncidentSettings: vi.fn(),
  changeStatus: vi.fn(),
  addIncidentComment: vi.fn(),
  uploadEvidence: vi.fn(),
  getEvidenceBlob: vi.fn(),
  INCIDENT_TYPES: ['averia', 'rotura', 'queja'],
  INCIDENT_STATUSES: ['abierta', 'en_atencion', 'resuelta', 'validada', 'descartada'],
  INCIDENT_SEVERITIES: ['baja', 'media', 'alta', 'critica'],
  INCIDENT_CAUSES: ['produccion', 'servicio', 'cliente', 'desconocida'],
  COMPLAINT_KINDS: ['plato_frio', 'plato_demorado', 'sabor_o_coccion', 'objeto_extrano', 'otro'],
  INCIDENT_AREAS: ['kitchen', 'lounge', 'bar', 'general'],
  INCIDENT_TYPE_LABELS: { averia: 'Avería', rotura: 'Rotura', queja: 'Queja' },
  INCIDENT_STATUS_LABELS: {
    abierta: 'Abierta',
    en_atencion: 'En atención',
    resuelta: 'Resuelta',
    validada: 'Validada',
    descartada: 'Descartada',
  },
  INCIDENT_SEVERITY_LABELS: { baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Crítica' },
  INCIDENT_CAUSE_LABELS: {
    produccion: 'Falla en cocina / producción',
    servicio: 'Falla en servicio / salón',
    cliente: 'Preferencia del cliente',
    desconocida: 'No determinada',
  },
  COMPLAINT_KIND_LABELS: {
    plato_frio: 'Plato frío',
    plato_demorado: 'Demora excesiva',
    sabor_o_coccion: 'Sabor / punto de cocción',
    objeto_extrano: 'Objeto extraño',
    otro: 'Otro motivo',
  },
  INCIDENT_AREA_LABELS: {
    kitchen: 'Cocina',
    lounge: 'Salón',
    bar: 'Barra',
    general: 'General',
  },
}));

describe('IncidentsView', () => {
  const adminUser = {
    id: 1,
    name: 'Admin User',
    role: 'owner',
    capabilities: {
      is_owner: true,
      abilities: ['incidents.manage', 'settings.manage'],
    },
  };

  const staffUser = {
    id: 5,
    name: 'Mozo User',
    role: 'lounge_staff',
    capabilities: {
      is_owner: false,
      abilities: ['incidents.report'],
    },
  };

  const sampleIncidents = [
    {
      id: 101,
      type: 'averia',
      status: 'abierta',
      severity: 'alta',
      area: 'kitchen',
      title: 'Plancha no calienta',
      description: 'La resistencia del lado izquierdo no calienta.',
      created_at: new Date().toISOString(),
      events: [],
    },
    {
      id: 102,
      type: 'rotura',
      status: 'resuelta',
      area: 'lounge',
      title: 'Rotura de copas',
      asset_label: 'Copa de vino',
      quantity: 3,
      created_at: new Date().toISOString(),
      events: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    incidentsClient.listIncidents.mockResolvedValue({
      ok: true,
      data: {
        data: sampleIncidents,
        meta: { current_page: 1, last_page: 1 },
      },
    });
    incidentsClient.getIncidentRecurrence.mockResolvedValue({
      ok: true,
      data: {
        por_tipo: [{ label: 'averia', total: 4 }],
        por_plato: [],
        por_activo: [{ label: 'Copa de vino', total: 3 }],
        por_titulo: [{ label: 'Plancha no calienta', total: 2 }],
      },
    });
    incidentsClient.getIncidentSettings.mockResolvedValue({
      ok: true,
      data: { reminder_after_hours: 4, escalation_after_hours: 24 },
    });
  });

  it('renders header, report button and loads incidents', async () => {
    const onBack = vi.fn();
    render(<IncidentsView user={adminUser} onBack={onBack} />);

    expect(screen.getByText('Incidencias')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reportar/i })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Volver'));
    expect(onBack).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('Plancha no calienta')).toBeInTheDocument();
      expect(screen.getByText('Rotura de copas')).toBeInTheDocument();
    });
  });

  it('staff sees no tabs toolbar, but owner sees all tabs', async () => {
    const { rerender } = render(<IncidentsView user={staffUser} />);
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();

    rerender(<IncidentsView user={adminUser} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Mi área' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Reporté' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Todas' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Recurrencias' })).toBeInTheDocument();
  });

  it('navigates to recurrence tab and displays analytics', async () => {
    render(<IncidentsView user={adminUser} />);

    const recurTab = screen.getByRole('tab', { name: 'Recurrencias' });
    fireEvent.click(recurTab);

    await waitFor(() => {
      expect(incidentsClient.getIncidentRecurrence).toHaveBeenCalled();
      expect(screen.getByText('Más repetidas en los últimos 30 días')).toBeInTheDocument();
      expect(screen.getByText('Copa de vino')).toBeInTheDocument();
    });
  });

  it('opens and closes settings modal', async () => {
    render(<IncidentsView user={adminUser} />);

    const settingsBtn = screen.getByLabelText('Ajustes');
    fireEvent.click(settingsBtn);

    await waitFor(() => {
      expect(screen.getByText('Ajustes de seguimiento')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Cerrar'));
    await waitFor(() => {
      expect(screen.queryByText('Ajustes de seguimiento')).not.toBeInTheDocument();
    });
  });

  it('opens report sheet when clicking Reportar', async () => {
    render(<IncidentsView user={staffUser} />);

    fireEvent.click(screen.getByRole('button', { name: /Reportar/i }));
    expect(screen.getByText('¿Qué tipo de problema ocurrió?')).toBeInTheDocument();
  });

  it('opens detail when clicking an incident card and returns on back', async () => {
    render(<IncidentsView user={adminUser} />);

    await waitFor(() => {
      expect(screen.getByText('Plancha no calienta')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Plancha no calienta'));

    await waitFor(() => {
      expect(screen.getByText('La resistencia del lado izquierdo no calienta.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Volver'));

    await waitFor(() => {
      expect(screen.getByText('Plancha no calienta')).toBeInTheDocument();
    });
  });

  it('loads incident directly when initialId is provided', async () => {
    incidentsClient.getIncident.mockResolvedValueOnce({
      ok: true,
      data: sampleIncidents[0],
    });

    render(<IncidentsView user={adminUser} initialId={101} />);

    await waitFor(() => {
      expect(incidentsClient.getIncident).toHaveBeenCalledWith(101);
      expect(screen.getByText('La resistencia del lado izquierdo no calienta.')).toBeInTheDocument();
    });
  });
});
