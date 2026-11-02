import { request, uploadFile, getAuthToken, getApiBaseUrl } from './apiClient';

export const INCIDENT_TYPES = ['averia', 'rotura', 'queja'];
export const INCIDENT_STATUSES = ['abierta', 'en_atencion', 'resuelta', 'validada', 'descartada'];
export const INCIDENT_SEVERITIES = ['baja', 'media', 'alta'];
export const INCIDENT_CAUSES = ['produccion', 'servicio', 'proveedor', 'otro'];
export const COMPLAINT_KINDS = ['plato_frio', 'preparacion_incorrecta', 'demora', 'atencion', 'otro'];
export const INCIDENT_AREAS = ['kitchen', 'lounge', 'warehouse'];

export const INCIDENT_TYPE_LABELS = Object.freeze({
  averia: 'Avería',
  rotura: 'Rotura',
  queja: 'Queja',
});

export const INCIDENT_STATUS_LABELS = Object.freeze({
  abierta: 'Abierta',
  en_atencion: 'En atención',
  resuelta: 'Resuelta',
  validada: 'Validada',
  descartada: 'Descartada',
});

export const INCIDENT_SEVERITY_LABELS = Object.freeze({
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
});

export const INCIDENT_CAUSE_LABELS = Object.freeze({
  produccion: 'Producción',
  servicio: 'Servicio',
  proveedor: 'Proveedor',
  otro: 'Otro',
});

export const COMPLAINT_KIND_LABELS = Object.freeze({
  plato_frio: 'Plato frío',
  preparacion_incorrecta: 'Preparación incorrecta',
  demora: 'Demora',
  atencion: 'Atención',
  otro: 'Otro',
});

export const INCIDENT_AREA_LABELS = Object.freeze({
  kitchen: 'Cocina',
  lounge: 'Salón',
  warehouse: 'Bodega',
});

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_EVIDENCE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

function unwrap(res) {
  if (res && res.ok && res.data && typeof res.data === 'object' && 'data' in res.data) {
    return { ...res, data: res.data.data };
  }
  return res;
}

/**
 * POST /api/v1/incidents
 */
export async function createIncident(data = {}) {
  const {
    type,
    area,
    title,
    description,
    severity = 'media',
    asset_label,
    quantity,
    dish_name,
    complaint_kind,
    cause,
    remade,
    asset_id,
    occurred_at,
  } = data;

  if (!INCIDENT_TYPES.includes(type)) {
    return { ok: false, status: 400, error: 'Tipo de incidencia inválido (averia, rotura o queja).' };
  }

  const trimmedTitle = typeof title === 'string' ? title.trim() : '';
  if (trimmedTitle.length < 2 || trimmedTitle.length > 120) {
    return { ok: false, status: 400, error: 'El título debe tener entre 2 y 120 caracteres.' };
  }

  const trimmedDesc = typeof description === 'string' ? description.trim() : '';
  if (trimmedDesc.length < 2 || trimmedDesc.length > 1000) {
    return { ok: false, status: 400, error: 'La descripción o relato debe tener entre 2 y 1000 caracteres.' };
  }

  const body = {
    type,
    title: trimmedTitle,
    description: trimmedDesc,
  };

  if (area && INCIDENT_AREAS.includes(area)) body.area = area;
  if (severity && INCIDENT_SEVERITIES.includes(severity)) body.severity = severity;
  if (occurred_at) body.occurred_at = occurred_at;
  if (asset_id) body.asset_id = parseInt(String(asset_id), 10);

  if (type === 'rotura') {
    const trimmedAsset = typeof asset_label === 'string' ? asset_label.trim() : '';
    if (trimmedAsset.length < 2 || trimmedAsset.length > 120) {
      return { ok: false, status: 400, error: 'Indica qué objeto se rompió (de 2 a 120 caracteres).' };
    }
    const qty = parseInt(String(quantity), 10);
    if (isNaN(qty) || qty <= 0) {
      return { ok: false, status: 400, error: 'La cantidad rota debe ser un número entero mayor que 0.' };
    }
    body.asset_label = trimmedAsset;
    body.quantity = qty;
  }

  if (type === 'queja') {
    const trimmedDish = typeof dish_name === 'string' ? dish_name.trim() : '';
    if (trimmedDish.length < 2 || trimmedDish.length > 120) {
      return { ok: false, status: 400, error: 'Indica el nombre del plato de la queja (de 2 a 120 caracteres).' };
    }
    if (!COMPLAINT_KINDS.includes(complaint_kind)) {
      return { ok: false, status: 400, error: 'Selecciona una clase de queja válida.' };
    }
    body.dish_name = trimmedDish;
    body.complaint_kind = complaint_kind;
    if (cause && INCIDENT_CAUSES.includes(cause)) body.cause = cause;
    if (remade !== undefined) body.remade = Boolean(remade);
  }

  const res = await request('/incidents', {
    method: 'POST',
    body,
  });
  return unwrap(res);
}

/**
 * GET /api/v1/incidents?status=&type=&area=&page=
 */
export async function listIncidents(filters = {}) {
  const params = new URLSearchParams();
  if (filters.page && Number.isInteger(Number(filters.page)) && Number(filters.page) > 0) {
    params.set('page', String(filters.page));
  }
  if (filters.status && INCIDENT_STATUSES.includes(filters.status)) {
    params.set('status', filters.status);
  }
  if (filters.type && INCIDENT_TYPES.includes(filters.type)) {
    params.set('type', filters.type);
  }
  if (filters.area && INCIDENT_AREAS.includes(filters.area)) {
    params.set('area', filters.area);
  }

  const qs = params.toString();
  return request(`/incidents${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/v1/incidents/{id}
 */
export async function getIncident(id) {
  const idStr = String(id ?? '').trim();
  if (!/^\d+$/.test(idStr)) {
    return { ok: false, status: 400, error: 'Identificador de incidencia inválido.' };
  }
  const res = await request(`/incidents/${idStr}`);
  return unwrap(res);
}

/**
 * POST /api/v1/incidents/{id}/evidence
 */
export async function uploadEvidence(id, file) {
  const idStr = String(id ?? '').trim();
  if (!/^\d+$/.test(idStr)) {
    return { ok: false, status: 400, error: 'Identificador de incidencia inválido.' };
  }
  if (!file) {
    return { ok: false, status: 400, error: 'Selecciona un archivo para subir.' };
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { ok: false, status: 400, error: 'Solo se permiten imágenes JPG, PNG o WEBP.' };
  }
  if (file.size > MAX_EVIDENCE_SIZE_BYTES) {
    return { ok: false, status: 400, error: 'La imagen no puede superar los 8 MB.' };
  }

  const res = await uploadFile(`/incidents/${idStr}/evidence`, file, 'file');
  return unwrap(res);
}

/**
 * Devuelve la URL interna de streaming para una evidencia (sin token en la URL).
 */
export function evidenceUrl(id, evidenceId) {
  const base = getApiBaseUrl();
  return `${base}/incidents/${id}/evidence/${evidenceId}`;
}

/**
 * Descarga la evidencia como Blob pasando el Bearer token en el encabezado.
 */
export async function getEvidenceBlob(id, evidenceId) {
  const url = evidenceUrl(id, evidenceId);
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

/**
 * POST /api/v1/incidents/{id}/status
 */
export async function changeStatus(id, status, payload = {}) {
  const idStr = String(id ?? '').trim();
  if (!/^\d+$/.test(idStr)) {
    return { ok: false, status: 400, error: 'Identificador de incidencia inválido.' };
  }
  if (!INCIDENT_STATUSES.includes(status)) {
    return { ok: false, status: 400, error: 'Estado de incidencia inválido.' };
  }

  if (status === 'resuelta') {
    const resolution = typeof payload.resolution === 'string' ? payload.resolution.trim() : '';
    if (resolution.length < 5 || resolution.length > 1000) {
      return { ok: false, status: 400, error: 'La resolución es obligatoria y debe tener entre 5 y 1000 caracteres.' };
    }
  }

  if (status === 'descartada') {
    const reason = typeof payload.reason === 'string' ? payload.reason.trim() : '';
    if (reason.length < 5 || reason.length > 1000) {
      return { ok: false, status: 400, error: 'El motivo de descarte es obligatorio y debe tener entre 5 y 1000 caracteres.' };
    }
  }

  const body = { status, ...payload };
  const res = await request(`/incidents/${idStr}/status`, {
    method: 'POST',
    body,
  });
  return unwrap(res);
}

/**
 * POST /api/v1/incidents/{id}/kitchen-confirm
 */
export async function kitchenConfirm(id) {
  const idStr = String(id ?? '').trim();
  if (!/^\d+$/.test(idStr)) {
    return { ok: false, status: 400, error: 'Identificador de incidencia inválido.' };
  }
  const res = await request(`/incidents/${idStr}/kitchen-confirm`, { method: 'POST' });
  return unwrap(res);
}

/**
 * POST /api/v1/incidents/{id}/assign
 */
export async function assignIncident(id, userId) {
  const idStr = String(id ?? '').trim();
  if (!/^\d+$/.test(idStr)) {
    return { ok: false, status: 400, error: 'Identificador de incidencia inválido.' };
  }
  const parsedUser = parseInt(String(userId), 10);
  if (isNaN(parsedUser) || parsedUser <= 0) {
    return { ok: false, status: 400, error: 'Identificador de usuario asignado inválido.' };
  }
  const res = await request(`/incidents/${idStr}/assign`, {
    method: 'POST',
    body: { assigned_to: parsedUser },
  });
  return unwrap(res);
}

/**
 * POST /api/v1/incidents/{id}/comments
 */
export async function addIncidentComment(id, text) {
  const idStr = String(id ?? '').trim();
  if (!/^\d+$/.test(idStr)) {
    return { ok: false, status: 400, error: 'Identificador de incidencia inválido.' };
  }
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (trimmed.length < 2 || trimmed.length > 1000) {
    return { ok: false, status: 400, error: 'El comentario debe tener entre 2 y 1000 caracteres.' };
  }
  const res = await request(`/incidents/${idStr}/comments`, {
    method: 'POST',
    body: { comment: trimmed },
  });
  return unwrap(res);
}

/**
 * POST /api/v1/incidents/{id}/waste
 */
export async function registerIncidentWaste(id, items = [], location = 'kitchen') {
  const idStr = String(id ?? '').trim();
  if (!/^\d+$/.test(idStr)) {
    return { ok: false, status: 400, error: 'Identificador de incidencia inválido.' };
  }
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, status: 400, error: 'Debes incluir al menos un insumo para la merma.' };
  }
  const res = await request(`/incidents/${idStr}/waste`, {
    method: 'POST',
    body: { items, location },
  });
  return unwrap(res);
}

/**
 * GET /api/v1/incidents/recurrence?days=30
 */
export async function getIncidentRecurrence(days = 30) {
  const d = parseInt(String(days), 10);
  const safeDays = !isNaN(d) && d >= 1 && d <= 365 ? d : 30;
  const res = await request(`/incidents/recurrence?days=${safeDays}`);
  return unwrap(res);
}

/**
 * GET /api/v1/incidents/settings
 */
export async function getIncidentSettings() {
  const res = await request('/incidents/settings');
  return unwrap(res);
}

/**
 * PUT /api/v1/incidents/settings
 */
export async function updateIncidentSettings(data = {}) {
  const rem = parseInt(String(data.averia_reminder_hours), 10);
  const esc = parseInt(String(data.averia_escalation_hours), 10);
  if (isNaN(rem) || rem < 1 || rem > 720 || isNaN(esc) || esc < 1 || esc > 720) {
    return { ok: false, status: 400, error: 'Las horas deben ser enteros entre 1 y 720.' };
  }
  if (esc <= rem) {
    return { ok: false, status: 400, error: 'El tiempo de escalamiento debe ser mayor que el recordatorio.' };
  }
  const res = await request('/incidents/settings', {
    method: 'PUT',
    body: { averia_reminder_hours: rem, averia_escalation_hours: esc },
  });
  return unwrap(res);
}
