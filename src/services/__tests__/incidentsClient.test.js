import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  createIncident,
  listIncidents,
  getIncident,
  uploadEvidence,
  evidenceUrl,
  getEvidenceBlob,
  changeStatus,
  kitchenConfirm,
  assignIncident,
  addIncidentComment,
  registerIncidentWaste,
  getIncidentRecurrence,
  getIncidentSettings,
  updateIncidentSettings,
  INCIDENT_TYPES,
  INCIDENT_STATUSES,
  INCIDENT_SEVERITIES,
  INCIDENT_CAUSES,
  COMPLAINT_KINDS,
} from '../incidentsClient';

describe('incidentsClient (Brief 37p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('listas cerradas', () => {
    it('declara los tipos, estados, severidades, causas y clases requeridos', () => {
      expect(INCIDENT_TYPES).toEqual(['averia', 'rotura', 'queja']);
      expect(INCIDENT_STATUSES).toEqual(['abierta', 'en_atencion', 'resuelta', 'validada', 'descartada']);
      expect(INCIDENT_SEVERITIES).toEqual(['baja', 'media', 'alta']);
      expect(INCIDENT_CAUSES).toEqual(['produccion', 'servicio', 'proveedor', 'otro']);
      expect(COMPLAINT_KINDS).toEqual(['plato_frio', 'preparacion_incorrecta', 'demora', 'atencion', 'otro']);
    });
  });

  describe('createIncident', () => {
    it('crea una rotura validando asset_label y quantity', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 201,
        data: { data: { id: 1, type: 'rotura' } },
      });

      const res = await createIncident({
        type: 'rotura',
        title: 'Vasos rotos',
        description: 'Se cayeron al limpiar la barra',
        asset_label: 'Vaso de agua',
        quantity: 3,
        area: 'lounge',
      });

      expect(spy).toHaveBeenCalledWith('/incidents', {
        method: 'POST',
        body: expect.objectContaining({
          type: 'rotura',
          title: 'Vasos rotos',
          asset_label: 'Vaso de agua',
          quantity: 3,
          area: 'lounge',
        }),
      });
      expect(res.ok).toBe(true);
      expect(res.data.id).toBe(1);
    });

    it('crea una queja validando dish_name y complaint_kind', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 201,
        data: { data: { id: 2, type: 'queja' } },
      });

      const res = await createIncident({
        type: 'queja',
        title: 'Carne fría',
        description: 'El cliente devolvió el plato',
        dish_name: 'Bife de chorizo',
        complaint_kind: 'plato_frio',
      });

      expect(spy).toHaveBeenCalledWith('/incidents', expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          dish_name: 'Bife de chorizo',
          complaint_kind: 'plato_frio',
        }),
      }));
      expect(res.ok).toBe(true);
    });

    it('rechaza tipo inválido o título muy corto', async () => {
      const res1 = await createIncident({ type: 'invalido' });
      expect(res1.ok).toBe(false);

      const res2 = await createIncident({ type: 'averia', title: 'a', description: 'descripción válida' });
      expect(res2.ok).toBe(false);
      expect(res2.error).toContain('título');
    });
  });

  describe('uploadEvidence', () => {
    it('valida tipo MIME y tamaño antes de llamar a uploadFile', async () => {
      const uploadSpy = vi.spyOn(apiClient, 'uploadFile').mockResolvedValue({
        ok: true,
        status: 201,
        data: { data: { id: 5 } },
      });

      const validFile = new File(['content'], 'foto.jpg', { type: 'image/jpeg' });
      const res = await uploadEvidence(10, validFile);

      expect(uploadSpy).toHaveBeenCalledWith('/incidents/10/evidence', validFile, 'file');
      expect(res.ok).toBe(true);
    });

    it('rechaza archivos no permitidos como PDF o ejecutables', async () => {
      const badFile = new File(['pdf'], 'doc.pdf', { type: 'application/pdf' });
      const res = await uploadEvidence(10, badFile);
      expect(res.ok).toBe(false);
      expect(res.error).toContain('Solo se permiten imágenes');
    });

    it('rechaza archivos mayores a 8 MB', async () => {
      const hugeFile = {
        name: 'huge.png',
        type: 'image/png',
        size: 9 * 1024 * 1024,
      };
      const res = await uploadEvidence(10, hugeFile);
      expect(res.ok).toBe(false);
      expect(res.error).toContain('8 MB');
    });
  });

  describe('evidenceUrl y getEvidenceBlob', () => {
    it('construye la URL de evidencia sin exponer token', () => {
      const url = evidenceUrl(10, 4);
      expect(url).toContain('/incidents/10/evidence/4');
      expect(url).not.toContain('token');
      expect(url).not.toContain('Bearer');
    });

    it('descarga blob pasando Bearer token por cabecera', async () => {
      vi.spyOn(apiClient, 'getAuthToken').mockReturnValue('token-123');
      const fakeBlob = new Blob(['img']);
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        blob: async () => fakeBlob,
      });

      const blob = await getEvidenceBlob(10, 4);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/incidents/10/evidence/4'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer token-123' },
        })
      );
      expect(blob).toBe(fakeBlob);
    });
  });

  describe('changeStatus', () => {
    it('exige resolución para estado resuelta', async () => {
      const res = await changeStatus(5, 'resuelta', {});
      expect(res.ok).toBe(false);
      expect(res.error).toContain('resolución');
    });

    it('exige motivo para estado descartada', async () => {
      const res = await changeStatus(5, 'descartada', {});
      expect(res.ok).toBe(false);
      expect(res.error).toContain('motivo de descarte');
    });

    it('envía cambio de estado válido', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: { id: 5, status: 'en_atencion' } },
      });

      const res = await changeStatus(5, 'en_atencion');
      expect(spy).toHaveBeenCalledWith('/incidents/5/status', {
        method: 'POST',
        body: { status: 'en_atencion' },
      });
      expect(res.ok).toBe(true);
    });
  });

  describe('acciones de detalle: kitchenConfirm, assign, comments, waste', () => {
    it('kitchenConfirm llama a /kitchen-confirm', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: { id: 8 } },
      });
      const res = await kitchenConfirm(8);
      expect(spy).toHaveBeenCalledWith('/incidents/8/kitchen-confirm', { method: 'POST' });
      expect(res.ok).toBe(true);
    });

    it('assignIncident valida userId numérico', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: { id: 8 } },
      });
      const res = await assignIncident(8, 12);
      expect(spy).toHaveBeenCalledWith('/incidents/8/assign', {
        method: 'POST',
        body: { assigned_to: 12 },
      });
      expect(res.ok).toBe(true);
    });

    it('addIncidentComment valida texto no vacío', async () => {
      const res = await addIncidentComment(8, '');
      expect(res.ok).toBe(false);

      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: { id: 8 } },
      });
      const valid = await addIncidentComment(8, 'Se contactó al técnico');
      expect(spy).toHaveBeenCalledWith('/incidents/8/comments', {
        method: 'POST',
        body: { comment: 'Se contactó al técnico' },
      });
      expect(valid.ok).toBe(true);
    });

    it('registerIncidentWaste envía los insumos y ubicación', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: { id: 8 } },
      });
      const res = await registerIncidentWaste(8, [{ item_id: 10, quantity: '1' }], 'kitchen');
      expect(spy).toHaveBeenCalledWith('/incidents/8/waste', {
        method: 'POST',
        body: { items: [{ item_id: 10, quantity: '1' }], location: 'kitchen' },
      });
      expect(res.ok).toBe(true);
    });
  });

  describe('settings y recurrence', () => {
    it('getIncidentRecurrence consulta /recurrence?days=30', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: { por_tipo: [] } },
      });
      await getIncidentRecurrence(30);
      expect(spy).toHaveBeenCalledWith('/incidents/recurrence?days=30');
    });

    it('updateIncidentSettings exige que escalamiento sea mayor que recordatorio y horas válidas', async () => {
      const res1 = await updateIncidentSettings({
        averia_reminder_hours: 48,
        averia_escalation_hours: 24,
      });
      expect(res1.ok).toBe(false);
      expect(res1.error).toContain('escalamiento debe ser mayor');

      const res2 = await updateIncidentSettings({
        averia_reminder_hours: -1,
        averia_escalation_hours: 10,
      });
      expect(res2.ok).toBe(false);
      expect(res2.error).toContain('enteros entre 1 y 720');

      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: { averia_reminder_hours: 24, averia_escalation_hours: 72 } },
      });
      const res3 = await updateIncidentSettings({
        averia_reminder_hours: 24,
        averia_escalation_hours: 72,
      });
      expect(spy).toHaveBeenCalledWith('/incidents/settings', {
        method: 'PUT',
        body: { averia_reminder_hours: 24, averia_escalation_hours: 72 },
      });
      expect(res3.ok).toBe(true);
    });

    it('getIncidentSettings consulta /settings', async () => {
      const spy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: { averia_reminder_hours: 24 } },
      });
      const res = await getIncidentSettings();
      expect(spy).toHaveBeenCalledWith('/incidents/settings');
      expect(res.ok).toBe(true);
    });
  });
});
