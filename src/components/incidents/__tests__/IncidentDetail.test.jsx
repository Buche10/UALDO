import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import IncidentDetail from '../IncidentDetail';
import * as incidentsClient from '../../../services/incidentsClient';

vi.mock('../../../services/incidentsClient', () => ({
  changeStatus: vi.fn(),
  kitchenConfirm: vi.fn(),
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

describe('IncidentDetail', () => {
  const mockUser = {
    id: 1,
    name: 'Admin User',
    role: 'owner',
    capabilities: { is_owner: true, permissions: ['incidents.manage'] },
  };

  const baseIncident = {
    id: 10,
    type: 'averia',
    status: 'abierta',
    severity: 'alta',
    area: 'kitchen',
    title: 'Horno no enciende',
    description: 'La chispa no salta al girar la perilla principal.',
    created_at: new Date().toISOString(),
    events: [
      { id: 1, kind: 'created', created_at: new Date().toISOString(), user: { name: 'Juan' } },
    ],
    evidence: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-blob');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when incident is null', () => {
    const { container } = render(<IncidentDetail incident={null} user={mockUser} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders incident information and back button', () => {
    const onBack = vi.fn();
    render(<IncidentDetail incident={baseIncident} user={mockUser} onBack={onBack} />);

    expect(screen.getByText('Horno no enciende')).toBeInTheDocument();
    expect(screen.getByText(/La chispa no salta/)).toBeInTheDocument();
    expect(screen.getByText('Avería')).toBeInTheDocument();
    expect(screen.getByText('Abierta')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Volver'));
    expect(onBack).toHaveBeenCalled();
  });

  it('allows owner/admin to change status to "en_atencion" when open', async () => {
    incidentsClient.changeStatus.mockResolvedValueOnce({
      ok: true,
      data: { ...baseIncident, status: 'en_atencion' },
    });
    const onUpdated = vi.fn();

    render(<IncidentDetail incident={baseIncident} user={mockUser} onUpdated={onUpdated} />);

    const attendBtn = screen.getByText('Atender');
    fireEvent.click(attendBtn);

    await waitFor(() => {
      expect(incidentsClient.changeStatus).toHaveBeenCalledWith(10, 'en_atencion', {});
      expect(onUpdated).toHaveBeenCalled();
    });
  });

  it('allows marking as resolved via ResolveModal when status is "en_atencion"', async () => {
    const activeIncident = { ...baseIncident, status: 'en_atencion' };
    incidentsClient.changeStatus.mockResolvedValueOnce({
      ok: true,
      data: { ...activeIncident, status: 'resuelta', resolution: 'Se cambió termocupla' },
    });
    const onUpdated = vi.fn();

    render(<IncidentDetail incident={activeIncident} user={mockUser} onUpdated={onUpdated} />);

    fireEvent.click(screen.getByText('Marcar resuelta'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const textarea = screen.getByLabelText(/Resolución aplicada/i);
    fireEvent.change(textarea, { target: { value: 'Se cambió termocupla' } });

    fireEvent.click(screen.getByText('Confirmar resolución'));

    await waitFor(() => {
      expect(incidentsClient.changeStatus).toHaveBeenCalledWith(10, 'resuelta', {
        resolution: 'Se cambió termocupla',
      });
      expect(onUpdated).toHaveBeenCalled();
    });
  });

  it('blocks "Validar" when complaint has cause "produccion" and kitchen is not confirmed', () => {
    const prodComplaint = {
      id: 20,
      type: 'queja',
      status: 'resuelta',
      cause: 'produccion',
      dish_name: 'Bife Ancho',
      complaint_kind: 'plato_frio',
      kitchen_confirmed_at: null,
      title: 'Carne cruda',
      description: 'Cliente pidió 3/4 y vino crudo',
      events: [],
    };

    render(<IncidentDetail incident={prodComplaint} user={mockUser} />);

    const validateBtn = screen.getByText('Validar');
    expect(validateBtn).toBeDisabled();
    expect(screen.getByText(/Validar bloqueado: falta confirmación de cocina/i)).toBeInTheDocument();
  });

  it('allows kitchen head or owner to confirm kitchen solution', async () => {
    const prodComplaint = {
      id: 20,
      type: 'queja',
      status: 'resuelta',
      cause: 'produccion',
      dish_name: 'Bife Ancho',
      kitchen_confirmed_at: null,
      title: 'Carne cruda',
      description: 'Cliente pidió 3/4 y vino crudo',
      events: [],
    };
    const kitchenHeadUser = {
      id: 2,
      role: 'kitchen_head',
      capabilities: { role: 'kitchen_head' },
    };

    incidentsClient.kitchenConfirm.mockResolvedValueOnce({
      ok: true,
      data: { ...prodComplaint, kitchen_confirmed_at: new Date().toISOString() },
    });
    const onUpdated = vi.fn();

    render(<IncidentDetail incident={prodComplaint} user={kitchenHeadUser} onUpdated={onUpdated} />);

    const confirmBtn = screen.getByText('Confirmar solución de cocina');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(incidentsClient.kitchenConfirm).toHaveBeenCalledWith(20);
      expect(onUpdated).toHaveBeenCalled();
    });
  });

  it('enables "Validar" once kitchen has confirmed', async () => {
    const confirmedComplaint = {
      id: 20,
      type: 'queja',
      status: 'resuelta',
      cause: 'produccion',
      kitchen_confirmed_at: new Date().toISOString(),
      title: 'Carne cruda',
      events: [],
    };
    incidentsClient.changeStatus.mockResolvedValueOnce({
      ok: true,
      data: { ...confirmedComplaint, status: 'validada' },
    });

    render(<IncidentDetail incident={confirmedComplaint} user={mockUser} />);

    const validateBtn = screen.getByText('Validar');
    expect(validateBtn).not.toBeDisabled();
    fireEvent.click(validateBtn);

    await waitFor(() => {
      expect(incidentsClient.changeStatus).toHaveBeenCalledWith(20, 'validada', {});
    });
  });

  it('allows discarding an incident with reason', async () => {
    incidentsClient.changeStatus.mockResolvedValueOnce({
      ok: true,
      data: { ...baseIncident, status: 'descartada' },
    });

    render(<IncidentDetail incident={baseIncident} user={mockUser} />);

    fireEvent.click(screen.getByText('Descartar'));
    const reasonInput = screen.getByLabelText(/Motivo del descarte/i);
    fireEvent.change(reasonInput, { target: { value: 'Reporte duplicado por error' } });
    fireEvent.click(screen.getByText('Confirmar descarte'));

    await waitFor(() => {
      expect(incidentsClient.changeStatus).toHaveBeenCalledWith(10, 'descartada', {
        reason: 'Reporte duplicado por error',
      });
    });
  });

  it('allows adding a comment', async () => {
    incidentsClient.addIncidentComment.mockResolvedValueOnce({
      ok: true,
      data: { ...baseIncident },
    });

    render(<IncidentDetail incident={baseIncident} user={mockUser} />);

    fireEvent.click(screen.getByText('Comentar'));
    const commentInput = screen.getByLabelText(/Comentario/i);
    fireEvent.change(commentInput, { target: { value: 'Se revisó la perilla' } });
    const submitBtn = screen.getAllByRole('button', { name: 'Comentar' }).find((b) => b.type === 'submit');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(incidentsClient.addIncidentComment).toHaveBeenCalledWith(10, 'Se revisó la perilla');
    });
  });

  it('allows previewing and closing an evidence photo', async () => {
    const incidentWithPhoto = {
      ...baseIncident,
      evidence: [{ id: 55, size_bytes: 204800, mime_type: 'image/jpeg' }],
    };
    incidentsClient.getEvidenceBlob.mockResolvedValueOnce(new Blob(['fake'], { type: 'image/jpeg' }));

    render(<IncidentDetail incident={incidentWithPhoto} user={mockUser} />);

    const photoBtn = screen.getByText(/Ver foto \(200 KB\)/i);
    fireEvent.click(photoBtn);

    await waitFor(() => {
      expect(incidentsClient.getEvidenceBlob).toHaveBeenCalledWith(10, 55);
      expect(screen.getByRole('img', { name: 'Evidencia' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Cerrar imagen'));
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });
});
